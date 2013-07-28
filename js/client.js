(function() {
  $(function() {
    var applianceCollection, applianceCollectionView, calculateSummary, comparisonCollection, comparisonCollectionView, current_page, fetchModels, in_use, initialiseInfoFrameCloseFunctionality, initialisePageCalculator, initialiseTariffSelector, summary_view, timerCollection, timerCollectionView, timer_view;
    summary_view = null;
    timer_view = null;
    applianceCollection = null;
    applianceCollectionView = null;
    timerCollection = null;
    timerCollectionView = null;
    comparisonCollection = null;
    comparisonCollectionView = null;
    window.user = null;
    window.tariff = null;
    current_page = null;
    in_use = $.cookie('in_use');
    if (in_use === 'true') {
      window.location.href = "/already_open";
    } else {
      $.cookie('in_use', 'true', {
        expires: 7
      });
    }
    window.onbeforeunload = function() {
      $.removeCookie('in_use');
      return null;
    };
    fetchModels = function() {
      return applianceCollection.fetch({
        success: function(collection, response) {
          console.log(applianceCollection.models);
          return timerCollection.fetch({
            data: {
              user_id: window.user.get('user_id')
            },
            success: function(collection, response) {
              timerCollection.addDummyTimers(applianceCollection.models);
              $('#timer_view_link').trigger('click');
              current_page = "timer";
              return initialiseInfoFrameCloseFunctionality();
            },
            error: function(h, response) {}
          });
        },
        error: function(h, response) {}
      });
    };
    initialiseInfoFrameCloseFunctionality = function() {
      $('#info_frame_close_link').on({
        'click': function(event) {
          return $('#info_frame_container').animate({
            opacity: 0
          }, 200, 'easeOutSine', function() {
            $('#info_frame_container').css('top', '-1000px');
            return $('body').css("overflow", "visible");
          });
        }
      });
      return false;
    };
    initialisePageCalculator = function() {
      var appliance, appliance_id, formatted_time, running_cost, timer, total_timestamp, unit_rate, updateTimer, wattage, _i, _len, _ref;
      unit_rate = window.tariff.unit_rate;
      _ref = timerCollection.models;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        timer = _ref[_i];
        appliance_id = timer.get('appliance_id');
        appliance = applianceCollection.get(appliance_id);
        wattage = appliance.get('wattage');
        if (timer.get('is_active') === 0) {
          total_timestamp = timer.get('total_timestamp');
          if (total_timestamp > 0) {
            formatted_time = formatTimestamp(total_timestamp);
            $('#' + timer.get('appliance_id') + '.time-display').html(formatted_time);
            running_cost = (total_timestamp / (60 * 60 * 1000)) * parseFloat(unit_rate) * (parseFloat(wattage) / 1000);
            $('#' + timer.get('appliance_id') + '.cost-display').html(running_cost);
          }
        }
      }
      updateTimer = function() {
        var is_active, start_timestamp, total_cost, _j, _len1, _ref1;
        window.current_timestamp = (new Date).getTime();
        total_cost = parseFloat(window.tariff.standing_charge);
        unit_rate = window.tariff.unit_rate;
        _ref1 = timerCollection.models;
        for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
          timer = _ref1[_j];
          appliance_id = timer.get('appliance_id');
          appliance = applianceCollection.get(appliance_id);
          wattage = appliance.get('wattage');
          is_active = timer.get('is_active');
          total_timestamp = timer.get('total_timestamp');
          if (is_active === 1) {
            start_timestamp = timer.get('start_timestamp');
            total_timestamp += current_timestamp - start_timestamp;
            formatted_time = formatTimestamp(total_timestamp);
            $('#' + timer.get('appliance_id') + '.time-display').html(formatted_time);
          }
          running_cost = (total_timestamp / (60 * 60 * 1000)) * parseFloat(unit_rate) * (parseFloat(wattage) / 1000);
          total_cost += running_cost;
          $('#' + timer.get('appliance_id') + '.cost-display').html(running_cost);
        }
        $('#total_cost').html(formatCurrency(total_cost));
        return console.log(total_cost);
      };
      return $.timer(updateTimer, 200, true);
    };
    initialiseTariffSelector = function() {
      var tariffSelector;
      tariffSelector = new TariffSelectorModel();
      return tariffSelector.fetch({
        success: function(model, response) {
          var tariffSelectorView;
          tariffSelectorView = new TariffSelectorView({
            model: tariffSelector
          });
          $('#tariff_options_frame').html(tariffSelectorView.render(window.user).el);
          return tariffSelectorView.updateTariffData();
        }
      });
    };
    calculateSummary = function() {
      var data, timestamp;
      timestamp = new Date().getTime();
      data = {
        user_id: window.user.get('user_id'),
        timestamp: timestamp
      };
      return $.get('/comparisons/generate', data, function(response) {
        comparisonCollection = new ComparisonCollection($.parseJSON(response));
        comparisonCollectionView = new ComparisonCollectionView({
          collection: comparisonCollection
        });
        return $('#comparisons').html(comparisonCollectionView.render().el);
      });
    };
    $('document').ready(function() {
      $('#timer_view_link').on({
        'click': function(event) {
          if ($('#timer_view_template').length === 0) {
            $.get("/views/fetch", {
              view: 'timer'
            }, function(template) {
              var appliances;
              $('#app_templates').append(template);
              $('#page_container').append($(template).html());
              appliances = applianceCollection.models;
              $('#timer_gallery').html(timerCollectionView.render(appliances).el);
              return initialisePageCalculator();
            });
          } else {
            if (current_page === "summary") {
              summary_view = $('#summary_view').detach();
              $('#page_container').append(timer_view);
            }
          }
          current_page = "timer";
          return false;
        }
      });
      $('#summary_view_link').on({
        'click': function(event) {
          if ($('#summary_view_template').length === 0) {
            $.get("/views/fetch", {
              view: 'summary'
            }, function(template) {
              $('#app_templates').append(template);
              timer_view = $('#timer_view').detach();
              return $('#page_container').append($(template).html());
            });
          } else {
            if (current_page === "timer") {
              timer_view = $('#timer_view').detach();
              $('#page_container').append(summary_view);
            }
          }
          calculateSummary();
          current_page = "summary";
          return false;
        }
      });
      return $('#info_frame_link').on({
        'click': function(event) {
          $('#info_frame_container').css('top', '0px');
          $('body').css("overflow", "hidden");
          return $('#info_frame_container').animate({
            opacity: 1
          }, 200, 'easeOutSine');
        }
      });
    });
    return $.get("/views/fetch", {
      view: 'models'
    }, function(templates) {
      var user_id;
      $('#app_templates').append(templates);
      $('#app_container').append($('#info_frame_template').html());
      $('#info_frame_container').css('top', '-1000px');
      initialiseApplianceModels();
      initialiseTimerModels();
      initialiseComparisonModels();
      initialiseTariffSelectorModel();
      initialiseUserModel();
      applianceCollection = new ApplianceCollection;
      applianceCollectionView = new ApplianceCollectionView({
        collection: applianceCollection
      });
      timerCollection = new TimerCollection;
      timerCollectionView = new TimerCollectionView({
        collection: timerCollection
      });
      window.user = new UserModel();
      if (typeof ($.cookie('user_id')) === 'undefined') {
        return $.get("/users/generateId", function(response) {
          var cookie_data, user_id;
          user_id = $.parseJSON(response);
          cookie_data = {
            expires: 1
          };
          $.cookie('user_id', user_id, cookie_data);
          window.user = new UserModel({
            user_id: user_id
          });
          return window.user.fetch({
            success: function(model, response) {
              fetchModels();
              return initialiseTariffSelector();
            }
          });
        });
      } else {
        user_id = $.cookie('user_id');
        $.cookie('user_id').expires = 1;
        window.user = new UserModel({
          user_id: user_id
        });
        return window.user.fetch({
          success: function(model, response) {
            fetchModels();
            return initialiseTariffSelector();
          }
        });
      }
    });
  });

}).call(this);
