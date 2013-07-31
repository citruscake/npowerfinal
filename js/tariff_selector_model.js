(function() {
  window.initialiseTariffSelectorModel = function() {
    window.TariffSelectorModel = Backbone.Model.extend({
      methodURL: {
        'read': '/tariff_selector_data/fetch'
      },
      sync: function(method, model, options) {
        if (model.methodURL && model.methodURL[method.toLowerCase()]) {
          options.url = model.methodURL[method.toLowerCase()];
        }
        return Backbone.sync(method, model, options);
      }
    });
    return window.TariffSelectorView = Backbone.View.extend({
      tagName: 'div',
      template: _.template($('#tariff_selector').html()),
      events: {
        'change #region_select': 'updateRegion',
        'change #provider_select': 'updateProvider',
        'change #tariff_select': 'updateTariff'
      },
      updateRegion: function(event) {
        var provided_tariffs, provider_id, provider_ids, region_id, regional_providers, tariff_id, tariffs;
        region_id = parseInt(event.target.value);
        tariffs = _.filter(this.model.get('tariff_data'), function(tariff) {
          return tariff.region_id === region_id;
        });
        provider_ids = _.uniq(_.map(tariffs, function(tariff) {
          return tariff.provider_id;
        }));
        regional_providers = _.sortBy(_.filter(this.model.get('provider_data'), function(provider) {
          if ($.inArray(provider.provider_id, provider_ids) === -1) {
            return false;
          } else {
            return true;
          }
        }), function(provider) {
          return provider.title;
        });
        provider_id = _.first(_.map(regional_providers, function(provider) {
          return provider.provider_id;
        }));
        provided_tariffs = _.sortBy(_.filter(tariffs, function(tariff) {
          return tariff.provider_id === provider_id;
        }), function(tariff) {
          return tariff.tariff_label;
        });
        tariff_id = _.first(_.map(provided_tariffs, function(tariff) {
          return tariff.tariff_id;
        }));
        window.user.set({
          region_id: region_id,
          provider_id: provider_id,
          tariff_id: tariff_id
        });
        window.user.save();
        $('#tariff_options_frame').html(this.render(window.user).el);
        this.delegateEvents();
        return this.updateTariffData();
      },
      updateProvider: function(event) {
        var provider_id, region_id, tariff_id, tariff_ids, tariffs;
        provider_id = parseInt(event.target.value);
        region_id = window.user.get('region_id');
        tariffs = _.filter(this.model.get('tariff_data'), function(tariff) {
          return (tariff.provider_id === provider_id) && (tariff.region_id === region_id);
        });
        tariff_ids = _.map(_.sortBy(tariffs, function(tariff) {
          return tariff.tariff_label;
        }), function(tariff) {
          return tariff.tariff_id;
        });
        tariff_id = _.first(tariff_ids);
        window.user.set({
          provider_id: provider_id,
          tariff_id: tariff_id
        });
        window.user.save();
        $('#tariff_options_frame').html(this.render(window.user).el);
        this.delegateEvents();
        return this.updateTariffData();
      },
      updateTariff: function(event) {
        var tariff_id;
        tariff_id = parseInt(event.target.value);
        window.user.set({
          tariff_id: tariff_id
        });
        window.user.save();
        return this.updateTariffData();
      },
      updateTariffData: function() {
        var tariff_data, tariff_id;
        tariff_data = this.model.get('tariff_data');
        tariff_id = window.user.get('tariff_id');
        window.tariff = _.find(tariff_data, function(tariff) {
          return tariff.tariff_id === tariff_id;
        });
        if (window.current_page === "summary") {
          return $('#summary_view_link').trigger('click');
        }
      },
      render: function(user_data) {
        var attributes;
        this.template = this['template'];
        attributes = {
          user_data: user_data.toJSON(),
          tariff_selector_data: this.model.toJSON()
        };
        this.$el.html(this.template(attributes));
        return this;
      }
    });
  };

}).call(this);
