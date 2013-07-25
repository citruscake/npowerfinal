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
        var appliance_id, data, is_active, start_timestamp, timer, timestamp, total_timestamp;
        is_active = this.model.get('is_active');
        if (is_active === 1) {
          timestamp = window.current_timestamp;
          start_timestamp = this.model.get('start_timestamp');
          total_timestamp = this.model.get('total_timestamp');
          total_timestamp += timestamp - start_timestamp;
          this.model.set('total_timestamp', total_timestamp);
          this.model.set('start_timestamp', '');
        } else {
          timestamp = (new Date).getTime();
          this.model.set('start_timestamp', timestamp);
        }
        appliance_id = this.model.get('appliance_id');
        data = {
          appliance_id: appliance_id,
          is_active: this.model.get('is_active'),
          user_id: window.user.get('user_id'),
          timestamp: timestamp
        };
        timer = this;
        return $.post('/timer/storeTimestamp', data, function(response) {
          response = JSON.parse(response);
          timer.model.set('is_active', response.is_active);
          console.log("is_Active " + response.is_active);
          return timer.animate(appliance_id, response.is_active);
        });
      },
      animate: function(appliance_id, is_active) {
        if (is_active === 0) {
          return $(this.el).animate({
            'background-color': '#eeeeee'
          }, 1000);
        } else if (is_active === 1) {
          return $(this.el).animate({
            'background-color': '#cccccc'
          }, 1000);
        }
      },
      render: function(appliance) {
        var attributes;
        this.template = this['template1'];
        attributes = $.extend(this.model.toJSON(), appliance.toJSON());
        this.$el.html(this.template(attributes));
        console.log("attributes...");
        console.log(attributes);
        $(this.el).addClass('thumbnail');
        $(this.el).attr('id', appliance.get('appliance_id'));
        $(this.el).find('.timer-display').attr('id', appliance.get('appliance_id'));
        return this;
      }
    });
    window.TimerCollectionView = Backbone.View.extend({
      tagName: 'ul',
      render: function(appliances) {
        var appliance, _i, _len;
        for (_i = 0, _len = appliances.length; _i < _len; _i++) {
          appliance = appliances[_i];
          this.renderTimer(appliance);
        }
        $(this.el).addClass('thumbnails');
        return this;
      },
      renderTimer: function(appliance) {
        var appliance_id, timerModel, timerView;
        appliance_id = appliance.get('appliance_id');
        timerModel = this.collection.get(appliance_id);
        timerView = new TimerView({
          model: timerModel
        });
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
      },
      addDummyTimers: function(appliances) {
        var appliance, appliance_id, timerModel, _i, _len, _results;
        _results = [];
        for (_i = 0, _len = appliances.length; _i < _len; _i++) {
          appliance = appliances[_i];
          appliance_id = appliance.get('appliance_id');
          timerModel = this.get(appliance_id);
          if (timerModel === void 0) {
            timerModel = new TimerModel({
              appliance_id: appliance_id,
              is_active: 0,
              total_timestamp: 0,
              start_timestamp: ""
            });
            _results.push(this.add(timerModel));
          } else {
            _results.push(void 0);
          }
        }
        return _results;
      }
    });
  };

}).call(this);
