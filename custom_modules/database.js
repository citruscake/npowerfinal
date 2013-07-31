(function() {
  var connection, database, host, mysql, password, user;

  mysql = require('mysql');

  connection = "";

  host = "";

  user = "";

  password = "";

  database = "";

  exports.createConnection = function(_host, _user, _password, _database) {
    host = _host;
    user = _user;
    password = _password;
    database = _database;
    return connection = mysql.createConnection({
      host: host,
      user: user,
      password: password,
      database: database
    });
  };

  exports.getAppliances = function(callback) {
    return connection.query('SELECT * FROM appliances WHERE 1 ORDER BY name ASC', function(error, rows, fields) {
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

  exports.createUserData = function(user_id, start_timestamp, callback) {
    console.log("INSERT INTO users VALUES ('" + user_id + "', '" + start_timestamp + "', 11, 1, 6)");
    return connection.query("INSERT INTO users VALUES ('" + user_id + "', '" + start_timestamp + "', 11, 1, 6)", function(error, rows, fields) {
      if (error) {
        throw error;
      } else {
        callback("success");
      }
    });
  };

  exports.saveUserData = function(user_id, region_id, provider_id, tariff_id, start_timestamp, callback) {
    return connection.query("UPDATE users SET region_id = '" + region_id + "', provider_id = '" + provider_id + "', tariff_id = '" + tariff_id + "', start_timestamp = '" + start_timestamp + "' WHERE user_id = '" + user_id + "'", function(error, rows, fields) {
      if (error) {
        throw error;
      } else {
        callback("success");
      }
    });
  };

  exports.deleteUserData = function(user_id, callback) {
    return connection.query("DELETE FROM users WHERE user_id = '" + user_id + "'", function(error, rows, fields) {
      if (error) {
        throw error;
      } else {
        connection.query("DELETE FROM timers WHERE user_id = '" + user_id + "'", function(error, rows, fields) {
          if (error) {
            throw error;
          }
        });
        callback("success");
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
        connection.query("SELECT timestamp_string FROM timers WHERE user_id = '" + user_id + "' AND appliance_id = " + appliance_id, function(error, rows, fields) {
          var timestamp_string;
          if (error) {
            throw error;
          } else {
            timestamp_string = rows[0].timestamp_string + "," + timestamp;
            return connection.query("UPDATE timers SET timestamp_string = '" + timestamp_string + "', is_active = " + is_active + " WHERE user_id = '" + user_id + "' AND appliance_id = '" + appliance_id + "'", function(error, rows, fields) {
              if (error) {
                throw error;
              }
            });
          }
        });
      } else {
        connection.query("INSERT INTO timers VALUES ('" + user_id + "'," + appliance_id + ",1," + timestamp + ")", function(error, rows, fields) {
          console.log(user_id);
          if (error) {
            throw error;
          }
        });
      }
      callback("success");
    });
  };

}).call(this);
