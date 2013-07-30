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
    var appliance, appliance_data, appliance_id, appliance_spend, cheapest_tariffs, comparison_data, end_point, highest_tariff, reward_data, start_timestamp, tariff, tariff_appliance_spend, tariff_data, tariff_id, tariff_spend, timer, timer_data, total_timestamp, user_appliance_spend, user_data, user_spend, user_tariff, wattage, _i, _j, _k, _len, _len1, _len2;
    timer_data = data.timer_data;
    end_point = data.end_point;
    user_data = data.user_data;
    reward_data = data.reward_data;
    appliance_data = data.appliance_data;
    tariff_data = _.filter(data.tariff_data, function(tariff) {
      return tariff.region_id === user_data.region_id;
    });
    appliance_spend = Array();
    for (_i = 0, _len = timer_data.length; _i < _len; _i++) {
      timer = timer_data[_i];
      console.log("here once?");
      total_timestamp = timer.total_timestamp;
      if (timer.is_active === 1) {
        start_timestamp = timer.start_timestamp;
        total_timestamp += end_point - start_timestamp;
        timer.total_timestamp = total_timestamp;
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
          total_spend: ((total_timestamp / (60 * 60 * 1000)) * parseFloat(tariff.unit_rate) * parseFloat(wattage)) / 1000
        });
      }
    }
    cheapest_tariffs = new Array();
    user_spend = "";
    console.log("am i here??");
    for (_k = 0, _len2 = tariff_data.length; _k < _len2; _k++) {
      tariff = tariff_data[_k];
      tariff_id = tariff.tariff_id;
      tariff_appliance_spend = _.filter(appliance_spend, function(spend) {
        return spend.tariff_id === tariff_id;
      });
      console.log("tariff_appliance_spend");
      console.log(tariff_appliance_spend);
      tariff_spend = _.reduce(tariff_appliance_spend, function(memo, spend) {
        return memo += spend.total_spend;
      }, 0);
      tariff_spend += parseFloat(tariff.standing_charge);
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
    user_tariff = _.find(tariff_data, function(tariff) {
      return tariff.tariff_id === user_spend.tariff_id;
    });
    user_appliance_spend = _.filter(appliance_spend, function(spend) {
      return spend.tariff_id === user_spend.tariff_id;
    });
    cheapest_tariffs = _.sortBy(cheapest_tariffs, function(tariff) {
      return tariff.tariff_spend;
    });
    comparison_data = Array();
    _.each(cheapest_tariffs, function(tariff) {
      var alternate_tariff, appliance_usages, daily_saving, reduction_fraction, saving_reward, tariff_comparison, yearly_saving;
      if (tariff.tariff_spend < user_spend.tariff_spend) {
        appliance_usages = Array();
        console.log("tariff spend : " + parseFloat(tariff.tariff_spend));
        console.log("user_tariff standing charge : " + parseFloat(user_tariff.standing_charge));
        console.log("user_spend tariff_spend : " + parseFloat(user_spend.tariff_spend));
        console.log("user tariff standing charge : " + parseFloat(user_tariff.standing_charge));
        if (tariff.tariff_spend - user_tariff.standing_charge <= 0) {
          reduction_fraction = 1;
        } else {
          reduction_fraction = (parseFloat(tariff.tariff_spend) - parseFloat(user_tariff.standing_charge)) / (parseFloat(user_spend.tariff_spend) - parseFloat(user_tariff.standing_charge));
        }
        _.each(timer_data, function(timer) {
          var reduced_timestamp, reduction_timestamp, spend, spend_target, unit_rate;
          spend = _.find(user_appliance_spend, function(spend) {
            return spend.appliance_id === timer.appliance_id;
          });
          spend_target = parseFloat(spend.total_spend) * reduction_fraction;
          console.log("reduction_fraction is " + reduction_fraction);
          appliance = _.find(appliance_data, function(appliance) {
            return appliance.appliance_id === timer.appliance_id;
          });
          console.log("spend target is " + spend_target + " for " + appliance.appliance_id);
          wattage = parseFloat(appliance.wattage);
          unit_rate = parseFloat(user_tariff.unit_rate);
          reduced_timestamp = ((spend_target * 1000) / (wattage * unit_rate)) * (60 * 60 * 1000);
          reduction_timestamp = parseFloat(timer.total_timestamp) - reduced_timestamp;
          console.log("total timestamp = " + timer.total_timestamp + ", reduced is " + reduced_timestamp);
          return appliance_usages.push({
            appliance_id: timer.appliance_id,
            reduction_timestamp: reduction_timestamp
          });
        });
        daily_saving = user_spend.tariff_spend - tariff.tariff_spend;
        yearly_saving = daily_saving * 365;
        alternate_tariff = _.find(tariff_data, function(_tariff) {
          return tariff.tariff_id === _tariff.tariff_id;
        });
        saving_reward = _.max(reward_data, function(reward) {
          return reward.cost <= yearly_saving;
        });
        tariff_comparison = {
          comparison_id: tariff.tariff_id,
          appliance_usages: appliance_usages,
          daily_saving: daily_saving.toFixed(2),
          yearly_saving: yearly_saving.toFixed(2),
          alternate_tariff: alternate_tariff,
          saving_reward: saving_reward,
          appliance_data: appliance_data
        };
        return comparison_data.push(tariff_comparison);
      }
    });
    return comparison_data;
  };

}).call(this);
