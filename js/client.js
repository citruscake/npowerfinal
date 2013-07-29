(function() {
  $(function() {
    var applianceCollection, applianceCollectionView, calculateSummary, comparisonCollection, comparisonCollectionView, current_page, fetchModels, in_use, initialiseInfoFrameCloseFunctionality, initialisePageCalculator, initialiseTariffSelector, summary_view, timerCollection, timerCollectionView, timer_view;
    summary_view = null;
    timer_view = null;
    window.tariffSelector = null;
    applianceCollection = null;
    applianceCollectionView = null;
    timerCollection = null;
    timerCollectionView = null;
    comparisonCollection = null;
    comparisonCollectionView = null;
    window.user = null;
    window.tariff = null;
    current_page = null;
    $('#timer_view_link').data("loading");
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
    fetchModels = function(existing_user) {
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
              if (existing_user === false) {
                $('#info_frame_link').trigger('click');
                $('#welcome_frame').html("Welcome new user");
              } else {
                $('#welcome_frame').html("Welcome back!");
              }
              initialiseInfoFrameCloseFunctionality();
              return $('#timer_view_link').removeData("loading");
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
      var appliance, appliance_id, calculatorTimer, running_cost, timer, total_timestamp, unit_rate, updateCalculatorTimer, wattage, _i, _len, _ref;
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
            $('#' + timer.get('appliance_id') + '.time-display').html(formatTimestamp(total_timestamp));
            running_cost = (total_timestamp / (60 * 60 * 1000)) * parseFloat(unit_rate) * (parseFloat(wattage) / 1000);
            $('#' + timer.get('appliance_id') + '.cost-display').html(formatCurrency(running_cost));
          }
        }
      }
      updateCalculatorTimer = function() {
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
            $('#' + timer.get('appliance_id') + '.time-display').html(formatTimestamp(total_timestamp));
          }
          running_cost = (total_timestamp / (60 * 60 * 1000)) * parseFloat(unit_rate) * (parseFloat(wattage) / 1000);
          total_cost += running_cost;
          if (is_active === 1) {
            $('#' + timer.get('appliance_id') + '.cost-display').html(formatCurrency(running_cost));
          }
        }
        $('#total_cost').html(formatCurrency(total_cost));
        return console.log(total_cost);
      };
      return calculatorTimer = $.timer(updateCalculatorTimer, 200, true);
    };
    initialiseTariffSelector = function() {
      window.tariffSelector = new TariffSelectorModel();
      return window.tariffSelector.fetch({
        success: function(model, response) {
          var tariffSelectorView;
          tariffSelectorView = new TariffSelectorView({
            model: window.tariffSelector
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
      return $.get('/comparisons/generate', data, function(response, callback) {
        comparisonCollection = new ComparisonCollection($.parseJSON(response));
        comparisonCollectionView = new ComparisonCollectionView({
          collection: comparisonCollection
        });
        console.log("comparison collection ");
        console.log(comparisonCollection.toJSON());
        $('#summary_view_link').data("comparison_data", comparisonCollectionView.render().el);
        return $('#summary_view_link').data("ready", true);
      });
    };
    $('document').ready(function() {
      $('#reset_app_link').on({
        'click': function(event) {
          var choice, user_id;
          choice = confirm('Would you like to start again?');
          if (choice === true) {
            user_id = window.user.get('user_id');
            return $.post('/users/delete', {
              user_id: user_id
            }, function(response) {
              $.removeCookie('user_id');
              return window.location.href = '/';
            });
          }
        }
      });
      $('#brand_frame').on({
        'click': function(event) {
          return window.location.href = "/";
        }
      });
      $('#timer_view_link').on({
        'click': function(event) {
          console.log($('#timer_view_link').data("loading"));
          console.log($('#summary_view_link').data("loading"));
          if ($('#timer_view_link').data("loading") || $('#summary_view_link').data("loading")) {
            return false;
          } else {
            $('#timer_view_link').data("loading", true);
            if ($('#timer_view_template').length === 0) {
              $.get("/views/fetch", {
                view: 'timer'
              }, function(template) {
                var appliances;
                $('#app_templates').append(template);
                $('#page_container').append($(template).html());
                appliances = applianceCollection.models;
                $('#timer_gallery').html(timerCollectionView.render(appliances).el);
                initialisePageCalculator();
                return $('#timer_view_link').removeData("loading");
              });
            } else {
              if (current_page === "summary") {
                summary_view = $('#summary_view').detach();
                $('#page_container').append(timer_view);
              }
              $('#timer_view_link').removeData("loading");
            }
            current_page = "timer";
            return false;
          }
        }
      });
      $('#summary_view_link').on({
        'click': function(event) {
          var summaryTimer, updateSummaryTimer;
          if ($('#summary_view_link').data("loading") || $('#timer_view_link').data("loading")) {
            return false;
          } else {
            if ($('#summary_view_template').length === 0) {
              $.get("/views/fetch", {
                view: 'summary'
              }, function(template) {
                var summaryTimer, updateSummaryTimer;
                $('#app_templates').append(template);
                updateSummaryTimer = function() {
                  console.log($('#summary_view_link').data("ready"));
                  if ($('#summary_view_link').data("ready") !== void 0) {
                    current_page = "summary";
                    timer_view = $('#timer_view').detach();
                    $('#page_container').append($(template).html());
                    $('#comparisons').html($('#summary_view_link').data('comparison_data'));
                    $('#summary_view_link').removeData("ready");
                    $('#summary_view_link').removeData("loading");
                    $('#summary_view_link').removeData("comparison_data");
                    return summaryTimer.stop();
                  }
                };
                summaryTimer = $.timer(updateSummaryTimer, 200, true);
                return calculateSummary();
              });
            } else {
              if (current_page === "timer") {
                updateSummaryTimer = function() {
                  if ($('#summary_view_link').data("ready") !== void 0) {
                    current_page = "summary";
                    timer_view = $('#timer_view').detach();
                    $('#page_container').append(summary_view);
                    $('#comparisons').html($('#summary_view_link').data('comparison_data'));
                    $('#summary_view_link').removeData("loading");
                    $('#summary_view_link').removeData("ready");
                    $('#summary_view_link').removeData("comparison_data");
                    return summaryTimer.stop();
                  }
                };
                summaryTimer = $.timer(updateSummaryTimer, 200, true);
                calculateSummary();
                $('#page_container').append(summary_view);
              } else {
                $('#summary_view_link').removeData("loading");
              }
            }
            return false;
          }
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
      var start_timestamp, user_id;
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
        start_timestamp = new Date().getTime();
        return $.post("/users/create", {
          start_timestamp: start_timestamp
        }, function(response) {
          var cookie_data, user_id;
          user_id = $.parseJSON(response);
          cookie_data = {
            expires: 3
          };
          $.cookie('user_id', user_id, cookie_data);
          window.user = new UserModel({
            user_id: user_id
          });
          return window.user.fetch({
            success: function(model, response) {
              fetchModels(false);
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
            fetchModels(true);
            return initialiseTariffSelector();
          }
        });
      }
    });
  });

}).call(this);
