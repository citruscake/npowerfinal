(function() {
  var _;

  _ = require('underscore');

  exports.calculateTerminatedUsage = function(timers) {
    var data, i, is_active, start_timestamp, timer, timer_data, timestamp_string, timestamps, total_timestamp, _i, _j, _len, _ref;
    timer_data = Array();
    for (_i = 0, _len = timers.length; _i < _len; _i++) {
      timer = timers[_i];
      timestamp_string = timer.timestamp_string;
      total_timestamp = 0;
      if (timer.timestamp_string !== "") {
        timestamps = timestamp_string.split(",");
        for (i = _j = 0, _ref = timestamps.length; 0 <= _ref ? _j < _ref : _j > _ref; i = 0 <= _ref ? ++_j : --_j) {
          console.log("i here");
          if (i % 2 === 0) {
            if (i + 1 < timestamps.length) {
              total_timestamp += timestamps[i + 1] - timestamps[i];
            }
          }
        }
        if (timestamps.length % 2 === 1) {
          is_active = 1;
        } else {
          is_active = 0;
        }
      } else {
        is_active = 0;
      }
      if (is_active === 1) {
        start_timestamp = timestamps[timestamps.length - 1];
      } else {
        start_timestamp = '';
      }
      data = {
        appliance_id: timer.appliance_id,
        is_active: is_active,
        total_timestamp: total_timestamp,
        start_timestamp: start_timestamp
      };
      timer_data.push(data);
    }
    console.log("timer data " + timer_data);
    return timer_data;
  };

  exports.calculateComparisons = function(data) {
    var appliance, appliance_data, appliance_id, appliance_spend, cheapest_tariffs, comparison_data, end_point, highest_tariff, reward_data, start_timestamp, tariff, tariff_appliance_spend, tariff_data, tariff_id, tariff_spend, timer, timer_data, total_timestamp, usage_fractions, user_appliance_spend, user_data, user_spend, user_tariff, wattage, _i, _j, _k, _len, _len1, _len2;
    timer_data = data.timer_data;
    end_point = data.end_point;
    tariff_data = data.tariff_data;
    user_data = data.user_data;
    reward_data = data.reward_data;
    appliance_data = data.appliance_data;
    appliance_spend = Array();
    for (_i = 0, _len = timer_data.length; _i < _len; _i++) {
      timer = timer_data[_i];
      console.log("here once?");
      total_timestamp = timer.total_timestamp;
      if (timer.is_active === 1) {
        start_timestamp = timer.start_timestamp;
        total_timestamp += end_point - start_timestamp;
      }
      appliance_id = timer.appliance_id;
      appliance = _.first(_.filter(appliance_data, function(appliance) {
        return appliance.appliance_id === appliance_id;
      }));
      wattage = appliance.wattage;
      for (_j = 0, _len1 = tariff_data.length; _j < _len1; _j++) {
        tariff = tariff_data[_j];
        tariff_id = tariff.tariff_id;
        appliance_spend.push({
          tariff_id: tariff_id,
          appliance_id: appliance_id,
          total_spend: (total_timestamp / (60 * 60 * 1000)) * parseFloat(tariff.unit_rate) * parseFloat(wattage)
        });
      }
    }
    cheapest_tariffs = new Array();
    user_spend = "";
    for (_k = 0, _len2 = tariff_data.length; _k < _len2; _k++) {
      tariff = tariff_data[_k];
      tariff_id = tariff.tariff_id;
      tariff_appliance_spend = _.filter(appliance_spend, function(spend) {
        return spend.tariff_id === tariff_id;
      });
      tariff_spend = _.reduce(tariff_appliance_spend, function(memo, spend) {
        return memo += spend.total_spend;
      }, 0);
      tariff_spend += parseFloat(tariff.standing_charge);
      console.log("tariff_spend " + tariff_id + ", " + tariff_spend);
      if (tariff_id === user_data.tariff_id) {
        user_spend = {
          tariff_id: tariff_id,
          tariff_spend: tariff_spend
        };
      } else {
        if (cheapest_tariffs.length < 5) {
          cheapest_tariffs.push({
            tariff_id: tariff_id,
            tariff_spend: tariff_spend
          });
        } else {
          highest_tariff = _.max(cheapest_tariffs, function(tariff) {
            return tariff.tariff_spend;
          });
          if (tariff_spend < highest_tariff.tariff_spend) {
            cheapest_tariffs = _.without(cheapest_tariffs, highest_tariff);
            cheapest_tariffs.push({
              tariff_id: tariff_id,
              tariff_spend: tariff_spend
            });
          }
        }
      }
    }
    console.log(cheapest_tariffs);
    usage_fractions = Array();
    user_tariff = _.first(_.filter(tariff_data, function(tariff) {
      return tariff.tariff_id === user_spend.tariff_id;
    }));
    user_appliance_spend = _.filter(appliance_spend, function(spend) {
      return spend.tariff_id === user_spend.tariff_id;
    });
    console.log("user appliance spend");
    console.log(user_appliance_spend);
    console.log("ended");
    _.each(user_appliance_spend, function(spend) {
      console.log(spend.total_spend + " " + user_spend.tariff_spend + " ");
      console.log(user_tariff);
      return usage_fractions.push({
        appliance_id: spend.appliance_id,
        fraction: spend.total_spend / (user_spend.tariff_spend - parseFloat(user_tariff.standing_charge))
      });
    });
    console.log(usage_fractions);
    cheapest_tariffs = _.sortBy(cheapest_tariffs, function(tariff) {
      return -tariff.tariff_spend;
    });
    console.log(cheapest_tariffs);
    comparison_data = Array();
    _.each(cheapest_tariffs, function(tariff) {
      var alternate_tariff, appliance_usages, daily_saving, saving_reward, tariff_comparison, yearly_saving;
      if (tariff.tariff_spend < user_spend.tariff_spend) {
        appliance_usages = Array();
        _.each(timer_data, function(timer) {
          var reduction_timestamp, usage_fraction;
          usage_fraction = _.first(_.filter(usage_fractions, function(fraction) {
            return fraction.appliance_id === timer.appliance_id;
          }));
          reduction_timestamp = parseFloat(timer.total_timestamp) - ((parseFloat(timer.total_timestamp) * parseFloat(usage_fraction.fraction)) * ((parseFloat(tariff.tariff_spend) - parseFloat(user_tariff.standing_charge)) / (parseFloat(user_spend.tariff_spend) - parseFloat(user_tariff.standing_charge))));
          return appliance_usages.push({
            appliance_id: timer.appliance_id,
            reduction_timestamp: reduction_timestamp
          });
        });
        daily_saving = user_spend.tariff_spend - tariff.tariff_spend;
        yearly_saving = daily_saving * 365;
        alternate_tariff = _.first(_.filter(tariff_data, function(_tariff) {
          return tariff.tariff_id === _tariff.tariff_id;
        }));
        saving_reward = _.max(reward_data, function(reward) {
          return reward.cost <= yearly_saving;
        });
        console.log(appliance_usages);
        tariff_comparison = {
          comparison_id: tariff.tariff_id,
          appliance_usages: appliance_usages,
          daily_saving: daily_saving.toFixed(2),
          yearly_saving: yearly_saving.toFixed(2),
          alternate_tariff: alternate_tariff,
          saving_reward: saving_reward
        };
        return comparison_data.push(tariff_comparison);
      }
    });
    console.log(comparison_data);
    return comparison_data;
  };

}).call(this);
