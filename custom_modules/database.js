(function() {
  var connection, mysql;

  mysql = require('mysql');

  connection = "";

  exports.connect = function(host, user, password, database) {
    console.log(host, user, password, database);
    connection = mysql.createConnection({
      host: host,
      user: user,
      password: password,
      database: database
    });
    return connection.connect(function(error) {
      if (error) {
        throw error;
      }
    });
  };

  exports.getAppliances = function(callback) {
    return connection.query('SELECT * FROM appliances WHERE 1', function(error, rows, fields) {
      if (error) {
        throw error;
      } else {
        console.log(rows);
        callback(rows);
      }
    });
  };

  exports.getRewards = function(callback) {
    return connection.query("SELECT * FROM rewards", function(error, rows, fields) {
      if (error) {
        throw error;
      } else {
        callback(rows);
      }
    });
  };

  exports.getUserData = function(user_id, callback) {
    return connection.query("SELECT region_id, provider_id, start_timestamp, tariff_id FROM users WHERE user_id = '" + user_id + "'", function(error, rows, fields) {
      if (error) {
        throw error;
      } else {
        callback(rows);
      }
    });
  };

  exports.getTariffData = function(region_id, callback) {
    var query;
    if (region_id = '*') {
      query = "SELECT * FROM tariffs WHERE region_id LIKE '%'";
    } else {
      query = "SELECT * FROM tariffs WHERE region_id = '" + region_id + "'";
    }
    return connection.query(query, function(error, rows, fields) {
      if (error) {
        throw error;
      } else {
        callback(rows);
      }
    });
  };

  exports.getTimers = function(user_id, callback) {
    return connection.query("SELECT appliance_id, is_active, timestamp_string FROM timers WHERE user_id = '" + user_id + "'", function(error, rows, fields) {
      if (error) {
        throw error;
      } else {
        console.log(rows);
        callback(rows);
      }
    });
  };

  exports.getUserData = function(user_id, callback) {
    return connection.query("SELECT * FROM users WHERE user_id = '" + user_id + "'", function(error, rows, fields) {
      if (error) {
        throw error;
      } else {
        console.log(rows);
        callback(rows);
      }
    });
  };

  exports.getRegions = function(callback) {
    return connection.query("SELECT * FROM regions", function(error, rows, fields) {
      if (error) {
        throw error;
      } else {
        console.log(rows);
        callback(rows);
      }
    });
  };

  exports.getProviders = function(callback) {
    return connection.query("SELECT * FROM providers", function(error, rows, fields) {
      if (error) {
        throw error;
      } else {
        console.log(rows);
        callback(rows);
      }
    });
  };

  exports.appendTimeStamp = function(user_id, appliance_id, is_active, timestamp, callback) {
    return connection.query("SELECT COUNT(appliance_id) AS count FROM timers WHERE user_id = '" + user_id + "' AND appliance_id = " + appliance_id, function(error, rows, fields) {
      if (error) {
        throw error;
      }
      if (rows[0].count > 0) {
        console.log("here with " + user_id);
        connection.query("SELECT timestamp_string FROM timers WHERE user_id = '" + user_id + "' AND appliance_id = " + appliance_id, function(error, rows, fields) {
          var timestamp_string;
          timestamp_string = rows[0].timestamp_string + "," + timestamp;
          return connection.query("UPDATE timers SET timestamp_string = '" + timestamp_string + "', is_active = " + is_active + " WHERE user_id = '" + user_id + "' AND appliance_id = '" + appliance_id + "'", function(error, rows, fields) {
            if (error) {
              throw error;
            }
          });
        });
      } else {
        connection.query("INSERT INTO timers VALUES ('" + user_id + "'," + appliance_id + ",1," + timestamp + ")", function(error, rows, fields) {
          console.log(user_id);
          if (error) {
            throw error;
          }
        });
      }
      callback;
    });
  };

  exports.save = function(model, data) {};

}).call(this);
