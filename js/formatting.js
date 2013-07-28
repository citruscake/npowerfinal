(function() {
  window.formatTimestamp = function(timestamp) {
    var formatted_hours, formatted_minutes, formatted_seconds, formatted_time, time;
    time = new Date(timestamp);
    formatted_hours = String(time.getHours());
    formatted_minutes = String(time.getMinutes());
    formatted_seconds = String(time.getSeconds());
    if (formatted_hours.length < 2) {
      formatted_hours = "0" + formatted_hours;
    }
    if (formatted_minutes.length < 2) {
      formatted_minutes = "0" + formatted_minutes;
    }
    if (formatted_seconds.length < 2) {
      formatted_seconds = "0" + formatted_seconds;
    }
    return formatted_time = formatted_hours + ":" + formatted_minutes + ":" + formatted_seconds;
  };

  window.formatCurrency = function(amount) {
    return "&#163;" + String(amount.toFixed(2));
  };

}).call(this);
