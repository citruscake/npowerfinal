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
        'click .button': 'timerToggle',
        'click .turn-off': 'switchOff'
      },
      switchOff: function() {
        var is_active;
        is_active = this.model.get('is_active');
        if (is_active === 1) {
          return this.timerToggle();
        }
      },
      timerToggle: function() {
        var appliance_id, data, is_active, timer, timestamp;
        if (($('#app_container').data('complete') === false) && ($('#app_container').data('disable') === false)) {
          $('#app_container').data('disable', true);
          setTimeout(function() {
            return $('#app_container').data('disable', false);
          }, 400);
          is_active = this.model.get('is_active');
          timestamp = (new Date).getTime();
          if (is_active === 1) {
            timestamp = window.current_timestamp;
          }
          appliance_id = this.model.get('appliance_id');
          this.animatePress(appliance_id, is_active, 200);
          data = {
            appliance_id: appliance_id,
            is_active: this.model.get('is_active'),
            user_id: window.user.get('user_id'),
            timestamp: timestamp
          };
          timer = this;
          return $.post('/timer/storeTimestamp', data, function(response) {
            var start_timestamp, total_timestamp;
            response = JSON.parse(response);
            console.log("IS_ACTIVE " + response.is_active);
            if (response.is_active === 0) {
              start_timestamp = timer.model.get('start_timestamp');
              total_timestamp = timer.model.get('total_timestamp');
              total_timestamp += timestamp - start_timestamp;
              timer.model.set('total_timestamp', total_timestamp);
              timer.model.set('start_timestamp', '');
            } else {
              timer.model.set('start_timestamp', timestamp);
            }
            timer.model.set('is_active', response.is_active);
            return timer.animateColor(appliance_id, response.is_active, 200);
          });
        }
      },
      animatePress: function(appliance_id, is_active, timeframe) {
        var button;
        button = $('#' + appliance_id + '.button');
        if (is_active === 1) {
          return button.animate({
            'top': '-5px'
          }, timeframe);
        } else if (is_active === 0) {
          return button.animate({
            'top': '-3px'
          }, timeframe);
        }
      },
      animateColor: function(appliance_id, is_active, timeframe) {
        var button, cost, name, shadow, time;
        button = $('#' + appliance_id + '.button');
        shadow = $('#' + appliance_id + '.button-shadow');
        cost = $('#' + appliance_id + '.cost-display');
        time = $('#' + appliance_id + '.time-display');
        name = $('#' + appliance_id + '.name');
        console.log(button);
        if (is_active === 0) {
          button.animate({
            'background-color': '#666666'
          }, 0);
          shadow.delay(200).animate({
            'background-color': '#444444'
          }, 0);
          name.delay(200).animate({
            'color': '#555555'
          }, 0);
          cost.delay(200).animate({
            'color': '#555555'
          }, 0);
          return time.delay(200).animate({
            'color': '#555555'
          }, 0);
        } else if (is_active === 1) {
          button.animate({
            'background-color': 'rgb(34, 220, 255)'
          }, timeframe);
          shadow.delay(200).animate({
            'background-color': 'rgb(34, 220, 255)'
          }, timeframe);
          name.delay(200).animate({
            'color': '#eeeeee'
          }, 0);
          cost.delay(200).animate({
            'color': '#cccccc'
          }, 0);
          return time.delay(200).animate({
            'color': '#cccccc'
          }, 0);
        }
      },
      render: function(appliance) {
        var appliance_id, attributes, is_active;
        this.template = this['template1'];
        attributes = $.extend(this.model.toJSON(), appliance.toJSON());
        this.$el.html(this.template(attributes));
        console.log("attributes...");
        console.log(attributes);
        $(this.el).addClass('thumbnail');
        $(this.el).attr('id', appliance.get('appliance_id'));
        $(this.el).find('.timer-display').attr('id', appliance.get('appliance_id'));
        appliance_id = appliance.get('appliance_id');
        is_active = this.model.get('is_active');
        if (is_active === 0) {
          $(this.el).find('#' + appliance_id + '.button').css('background-color', '#666666');
          $(this.el).find('#' + appliance_id + '.button-shadow').css('background-color', '#444444');
        } else {
          $(this.el).find('#' + appliance_id + '.button').css('background-color', 'rgb(34, 220, 255)');
          $(this.el).find('#' + appliance_id + '.button-shadow').css('background-color', 'rgb(34, 220, 255)');
          $(this.el).find('#' + appliance_id + '.button').css('top', '-3px');
          $(this.el).find('#' + appliance_id + '.name').css('color', '#eeeeee');
          $(this.el).find('#' + appliance_id + '.cost-display').css('color', '#cccccc');
          $(this.el).find('#' + appliance_id + '.time-display').css('color', '#cccccc');
        }
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
