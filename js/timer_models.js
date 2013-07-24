(function() {
  window.initialiseTimerModels = function() {
    window.TimerModel = Backbone.Model.extend({
      idAttribute: 'appliance_id',
      methodURL: {
        'update': '/timer/update/display'
      },
      sync: function(method, model, options) {
        if (model.methodURL && model.methodURL[method.toLowerCase()]) {
          options.url = model.methodURL[method.toLowerCase()];
        }
        return Backbone.sync(method, model, options);
      }
    });
    window.TimerView = Backbone.View.extend({
      tagName: 'li',
      template1: _.template($('#app_timer').html()),
      events: {
        'click': 'timerToggle'
      },
      timerToggle: function() {
        var appliance_id, data, is_active, timer, timestamp;
        is_active = this.model.get('is_active');
        if (is_active === 1) {
          timestamp = window.current_timestamp;
          this.model.set('start_timestamp', '');
        } else {
          timestamp = (new Date).getTime();
          this.model.set('start_timestamp', timestamp);
        }
        appliance_id = this.model.get('appliance_id');
        data = {
          appliance_id: appliance_id,
          is_active: this.model.get('is_active'),
          user_id: window.user_id,
          timestamp: timestamp
        };
        timer = this;
        return $.post('/timer/storeTimestamp', data, function(response) {
          response = JSON.parse(response);
          timer.model.set('is_active', response.is_active);
          return timer.animate(appliance_id, response.is_active);
        });
      },
      animate: function(appliance_id, is_active) {
        if (is_active === 0) {
          return $(this.el).animate({
            'background-color': '#cccccc'
          }, 1000);
        } else if (is_active === 1) {
          return $(this.el).animate({
            'background-color': '#333333'
          }, 1000);
        }
      },
      render: function(appliance, has_timer) {
        var attributes;
        this.template = this['template1'];
        console.log(this.model);
        console.log(appliance);
        if (has_timer) {
          attributes = $.extend({}, this.model.toJSON());
        }
        attributes = $.extend(attributes, appliance.toJSON());
        this.$el.html(this.template(attributes));
        $(this.el).addClass('thumbnail');
        $(this.el).attr('id', appliance.get('appliance_id'));
        $(this.el).find('.timer-display').attr('id', appliance.get('appliance_id'));
        return this;
      }
    });
    window.TimerCollectionView = Backbone.View.extend({
      tagName: 'ul',
      render: function(appliances, timer_ids) {
        var appliance, appliance_id, _i, _len;
        for (_i = 0, _len = appliances.length; _i < _len; _i++) {
          appliance = appliances[_i];
          appliance_id = appliance.get('appliance_id');
          if ($.inArray(appliance_id, timer_ids)) {
            this.renderTimer(appliance, true);
          } else {
            this.renderTimer(appliance, false);
          }
        }
        $(this.el).addClass('thumbnails');
        return this;
      },
      renderTimer: function(appliance, has_timer) {
        var appliance_id, timerModel, timerView;
        appliance_id = appliance.get('appliance_id');
        timerModel = this.collection.get(appliance_id);
        if (timerModel !== void 0) {
          timerView = new TimerView({
            model: timerModel
          });
        } else {
          timerModel = new TimerModel({
            appliance_id: appliance_id,
            is_active: 0,
            total_timestamp: 0,
            start_timestamp: (new Date).getTime()
          });
          timerView = new TimerView({
            model: timerModel
          });
        }
        return this.$el.append(timerView.render(appliance).el);
      }
    });
    return window.TimerCollection = Backbone.Collection.extend({
      model: TimerModel,
      methodURL: {
        'read': '/timers/fetch'
      },
      sync: function(method, model, options) {
        if (model.methodURL && model.methodURL[method.toLowerCase()]) {
          options.url = model.methodURL[method.toLowerCase()];
        }
        return Backbone.sync(method, model, options);
      }
    });
  };

}).call(this);
