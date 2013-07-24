(function() {
  window.initialiseUsageModels = function(SERVER_ROOT, socket) {
    window.ApplianceUsageModel = Backbone.Model.extend({
      idAttribute: 'appliance_id'
    });
    window.ApplianceUsageView = Backbone.View.extend({
      tagName: 'li',
      template1: _.template($('#app_timer').html()),
      events: {
        'click': 'timerToggle'
      },
      timerToggle: function() {
        var is_active, timestamps;
        timestamps = this.model.get('timestamp_string').split(",");
        if ((timestamps.length % 2) === 0 || (timestamps[0] === '')) {
          is_active = 1;
          $(this.el).animate({
            'background-color': '#444444'
          }, 1000);
        } else {
          is_active = 0;
          $(this.el).animate({
            'background-color': 'none'
          }, 1000);
        }
        return socket.emit('timerToggle', this.model.get('appliance_id'), is_active);
      },
      renderRealtimeUsage: function(appliance) {
        var attributes;
        this.template = this['template1'];
        attributes = $.extend({}, this.model.toJSON(), appliance.toJSON());
        this.$el.html(this.template(attributes));
        $(this.el).addClass('thumbnail');
        $(this.el).addClass('ui-state-default');
        $(this.el).css('opacity', 0);
        return this;
      }
    });
    window.ApplianceUsageCollectionView = Backbone.View.extend({
      tagName: 'ul',
      renderRealtimeUsage: function(appliances) {
        var appliance, appliance_id, _i, _len;
        for (_i = 0, _len = appliances.length; _i < _len; _i++) {
          appliance = appliances[_i];
          appliance_id = appliance.get('appliance_id');
          this.renderOneAppliance(appliance, this.collection.get(appliance_id));
        }
        $(this.el).addClass('thumbnails');
        return this;
      },
      renderOneAppliance: function(appliance, applianceUsage) {
        var applianceUsageView;
        applianceUsageView = new ApplianceUsageView({
          model: applianceUsage
        });
        return this.$el.append(applianceUsageView.renderRealtimeUsage(appliance).el);
      }
    });
    return window.ApplianceUsageCollection = Backbone.Collection.extend({
      model: ApplianceUsageModel,
      url: SERVER_ROOT,
      methodURL: {
        'read': SERVER_ROOT + '/appliance_usage/fetch'
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