(function() {
  window.initialiseApplianceModels = function() {
    window.ApplianceModel = Backbone.Model.extend({
      idAttribute: 'appliance_id'
    });
    window.ApplianceView = Backbone.View.extend({
      tagName: 'li',
      template: _.template($('#app_button').html()),
      render: function() {
        var attributes;
        $(this.el).addClass('ui-state-default');
        $(this.el).addClass('thumbnail');
        $(this.el).addClass('draggable');
        $(this.el).attr('id', this.model.get('appliance_id'));
        $(this.el).css('cursor', 'pointer');
        attributes = this.model.toJSON();
        this.$el.html(this.template(attributes));
        return this;
      }
    });
    window.ApplianceCollection = Backbone.Collection.extend({
      model: ApplianceModel,
      methodURL: {
        'read': '/appliances/fetch'
      },
      sync: function(method, model, options) {
        if (model.methodURL && model.methodURL[method.toLowerCase()]) {
          options.url = model.methodURL[method.toLowerCase()];
        }
        return Backbone.sync(method, model, options);
      }
    });
    return window.ApplianceCollectionView = Backbone.View.extend({
      tagName: 'ul',
      render: function() {
        this.collection.forEach(this.renderAppliance, this);
        $(this.el).addClass('connectedSortable');
        $(this.el).addClass('thumbnails');
        $(this.el).disableSelection();
        return this;
      },
      renderAppliance: function(appliance) {
        var applianceView;
        applianceView = new ApplianceView({
          model: appliance
        });
        return this.$el.append(applianceView.render().el);
      }
    });
  };

}).call(this);
