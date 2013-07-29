(function() {
  window.formatTimestamp = function(timestamp, toString) {
    var formatted_hours, formatted_milliseconds, formatted_minutes, formatted_seconds, formatted_time, time;
    if (toString == null) {
      toString = true;
    }
    time = new Date(timestamp);
    formatted_hours = String(time.getHours());
    formatted_minutes = String(time.getMinutes());
    formatted_seconds = String(time.getSeconds());
    formatted_milliseconds = String(time.getMilliseconds());
    if (toString === true) {
      formatted_time = formatted_hours + "h " + formatted_minutes + "m " + formatted_seconds + "s " + formatted_milliseconds + "ms";
    } else {
      formatted_time = Array();
      if (parseInt(formatted_hours) > 0) {
        formatted_time.push(formatted_hours);
      } else {
        formatted_time.push("");
      }
      if (parseInt(formatted_minutes) > 0) {
        formatted_time.push(formatted_minutes);
      } else {
        formatted_time.push("");
      }
      if (parseInt(formatted_seconds) > 0) {
        formatted_time.push(formatted_seconds);
      } else {
        formatted_time.push("");
      }
      if (parseInt(formatted_milliseconds) > 0) {
        formatted_time.push(formatted_milliseconds);
      } else {
        formatted_time.push("");
      }
    }
    return formatted_time;
  };

  window.formatCurrency = function(amount) {
    return "&#163;" + String(amount.toFixed(2));
  };

}).call(this);
