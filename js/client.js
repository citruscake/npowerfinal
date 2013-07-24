(function() {
  $(function() {
    var applianceCollection, applianceCollectionView, calculateSummary, comparisonCollection, comparisonCollectionView, fetchModels, fetchTariffs, formatTimestamp, initCalculator, realtime_view, timeline_view, timerCollection, timerCollectionView, userModel;
    timeline_view = null;
    realtime_view = null;
    applianceCollection = null;
    applianceCollectionView = null;
    timerCollection = null;
    timerCollectionView = null;
    comparisonCollection = null;
    comparisonCollectionView = null;
    userModel = null;
    fetchModels = function() {
      return applianceCollection.fetch({
        success: function(collection, response) {
          return timerCollection.fetch({
            data: {
              user_id: window.user_id
            },
            success: function(collection, response) {
              return $('#realtime_view_link').trigger('click');
            },
            error: function(h, response) {}
          });
        },
        error: function(h, response) {}
      });
    };
    fetchTariffs = function() {
      return $.get("/tariff_selector_data/fetch", function(response) {
        var tariff_selector_data, template_data;
        tariff_selector_data = $.parseJSON(response);
        template_data = {
          user_data: userModel.toJSON()[0],
          tariff_selector_data: tariff_selector_data
        };
        console.log(template_data);
        return $('#tariff_options_frame').html(_.template(template_data));
      });
    };
    initCalculator = function() {
      var formatted_time, timer, total_timestamp, updateTimer, _i, _len, _ref;
      _ref = timerCollection.models;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        timer = _ref[_i];
        if (timer.get('is_active') === 0) {
          total_timestamp = timer.get('total_timestamp');
          formatted_time = formatTimestamp(total_timestamp);
          $('#' + timer.get('appliance_id') + '.timer-display').html(formatted_time);
        }
      }
      updateTimer = function() {
        var start_timestamp, _j, _len1, _ref1, _results;
        window.current_timestamp = (new Date).getTime();
        _ref1 = timerCollection.models;
        _results = [];
        for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
          timer = _ref1[_j];
          if (timer.get('is_active') === 1) {
            start_timestamp = timer.get('start_timestamp');
            total_timestamp = timer.get('total_timestamp') + current_timestamp - start_timestamp;
            formatted_time = formatTimestamp(total_timestamp);
            _results.push($('#' + timer.get('appliance_id') + '.timer-display').html(formatted_time));
          } else {
            _results.push(void 0);
          }
        }
        return _results;
      };
      return $.timer(updateTimer, 200, true);
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
              var animate_ids, appliance, appliance_id, appliances, is_displayed, timer, timer_el, timer_ids, _i, _len;
              $('#app_templates').append(template);
              $('#page_container').append($(template).html());
              timer_ids = [];
              appliances = applianceCollection.models;
              for (_i = 0, _len = appliances.length; _i < _len; _i++) {
                appliance = appliances[_i];
                appliance_id = appliance.get('appliance_id');
                timer = timerCollection.get(appliance_id);
                if (timer) {
                  console.log(timer);
                  is_displayed = timer.get('is_displayed');
                  timer_ids.push(appliance);
                }
              }
              timer_el = timerCollectionView.render(appliances, timer_ids).el;
              $('#timer_gallery').html(timer_el);
              initCalculator();
              animate_ids = [];
              $(timer_el).children('li').animate({
                opacity: 1
              }, 300);
              return false;
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
      initialiseUserModel();
      applianceCollection = new ApplianceCollection;
      applianceCollectionView = new ApplianceCollectionView({
        collection: applianceCollection
      });
      timerCollection = new TimerCollection;
      timerCollectionView = new TimerCollectionView({
        collection: timerCollection
      });
      userModel = new UserModel();
      if (typeof ($.cookie('user_id')) !== 'undefined') {
        return $.get("/users/generateId", function(response) {
          var user_id;
          user_id = $.parseJSON(response);
          $.cookie('user_id', user_id, {
            expires: 1,
            path: '/'
          });
          userModel = new UserModel({
            user_id: user_id
          });
          return userModel.fetch({
            success: function(model, response) {
              fetchModels();
              return fetchTariffs();
            }
          });
        });
      } else {
        user_id = $.cookie('user_id');
        $.cookie('user_id').expires = 1;
        userModel = new UserModel({
          user_id: user_id
        });
        return userModel.fetch({
          success: function(model, response) {
            fetchModels();
            return fetchTariffs();
          }
        });
      }
    });
  });

}).call(this);
