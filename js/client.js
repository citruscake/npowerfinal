(function() {
  $(function() {
    var applianceCollection, applianceCollectionView, calculateSummary, comparisonCollection, comparisonCollectionView, fetchModels, formatTimestamp, initialisePageCalculator, initialiseTariffSelector, realtime_view, timeline_view, timerCollection, timerCollectionView;
    timeline_view = null;
    realtime_view = null;
    applianceCollection = null;
    applianceCollectionView = null;
    timerCollection = null;
    timerCollectionView = null;
    comparisonCollection = null;
    comparisonCollectionView = null;
    window.user = null;
    window.tariff = null;
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
              return $('#realtime_view_link').trigger('click');
            },
            error: function(h, response) {}
          });
        },
        error: function(h, response) {}
      });
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
        return $('#total_cost').html(total_cost);
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
    formatTimestamp = function(timestamp) {
      var formatted_hours, formatted_milliseconds, formatted_minutes, formatted_seconds, formatted_time, time;
      time = new Date(timestamp);
      formatted_hours = String(time.getHours());
      formatted_minutes = String(time.getMinutes());
      formatted_seconds = String(time.getSeconds());
      formatted_milliseconds = String(time.getMilliseconds());
      if (formatted_hours.length < 2) {
        formatted_hours = "0" + formatted_hours;
      }
      if (formatted_minutes.length < 2) {
        formatted_minutes = "0" + formatted_minutes;
      }
      if (formatted_seconds.length < 2) {
        formatted_seconds = "0" + formatted_seconds;
      }
      if (formatted_milliseconds.length < 2) {
        formatted_milliseconds = "00" + formatted_milliseconds;
      } else if (formatted_milliseconds.length < 3) {
        formatted_milliseconds = "0" + formatted_milliseconds;
      }
      return formatted_time = formatted_hours + ":" + formatted_minutes + ":" + formatted_seconds + ":" + formatted_milliseconds;
    };
    calculateSummary = function() {
      var data, timestamp;
      timestamp = new Date().getTime();
      data = {
        user_id: window.user_id,
        timestamp: timestamp
      };
      return $.get('/comparisons/generate', data, function(response) {
        comparisonCollection = new ComparisonCollection($.parseJSON(response));
        comparisonCollectionView = new ComparisonCollectionView({
          collection: comparisonCollection
        });
        console.log(comparisonCollection.toJSON());
        return $('#savings').html(comparisonCollectionView.render().el);
      });
    };
    $('document').ready(function() {
      $('#realtime_view_link').on({
        'click': function(event) {
          $('#app_menu').children('li').eq(0).addClass('active_page');
          $('#app_menu').children('li').eq(1).removeClass('active_page');
          if ($('#realtime_view_template').length === 0) {
            return $.get("/views/fetch", {
              view: 'realtime'
            }, function(template) {
              var appliances;
              $('#app_templates').append(template);
              $('#page_container').append($(template).html());
              appliances = applianceCollection.models;
              $('#timer_gallery').html(timerCollectionView.render(appliances).el);
              return initialisePageCalculator();
            });
          } else {
            timeline_view = $('#timeline_view').detach();
            $('#page_container').append(realtime_view);
            return false;
          }
        }
      });
      return $('#timeline_view_link').on({
        'click': function(event) {
          $('#app_menu').children('li').eq(1).addClass('active_page');
          $('#app_menu').children('li').eq(0).removeClass('active_page');
          if ($('#timeline_view_template').length === 0) {
            $.get("/views/fetch", {
              view: 'timeline'
            }, function(template) {
              $('#app_templates').append(template);
              realtime_view = $('#realtime_view').detach();
              return $('#page_container').append($(template).html());
            });
          } else {
            realtime_view = $('#realtime_view').detach();
            $('#page_container').append(timeline_view);
          }
          calculateSummary();
          return false;
        }
      });
    });
    return $.get("/views/fetch", {
      view: 'models'
    }, function(templates) {
      var user_id;
      $('#app_templates').append(templates);
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
      if (typeof ($.cookie('user_id')) !== 'undefined') {
        return $.get("/users/generateId", function(response) {
          var user_id;
          user_id = $.parseJSON(response);
          $.cookie('user_id', user_id, {
            expires: 1,
            path: '/'
          });
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
