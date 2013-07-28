(function() {
  var app, calculator, config, database, env, express, fs, http, io, server, socket, user_id_generator, _;

  express = require('express');

  fs = require('fs');

  http = require('http');

  socket = require('socket.io');

  _ = require('underscore');

  database = require('./custom_modules/database');

  calculator = require('./custom_modules/calculator');

  user_id_generator = require('./custom_modules/user_id_generator');

  config = require('./custom_modules/config');

  if (process.env.VCAP_SERVICES) {
    env = JSON.parse(process.env.VCAP_SERVICES);
    config = env['mysql-5.1'][0]['credentials'];
    database.connect(config.hostname, config.username, config.password, config.db);
  } else {
    database.connect(config.data.host, config.data.username, config.data.password, config.data.database);
  }

  app = express();

  app.use(require('connect').bodyParser());

  server = http.createServer(app);

  io = socket.listen(server);

  server.listen(process.env.VCAP_APP_PORT || 3000);

  app.get('/', function(request, response) {
    return fs.readFile('./views/index.html', function(error, view) {
      response.writeHead(200, {
        'Access-Control-Allow-Origin': '*'
      });
      response.write(view);
      console.log(view);
      return response.end();
    });
  });

  app.get('/already_open', function(request, response) {
    response.writeHead(200, {
      'Access-Control-Allow-Origin': '*'
    });
    response.write("You have a page already open, please use only one instance at a time to prevent errors.");
    return response.end();
  });

  app.get('/js/:folder1?/:folder2?/:file', function(request, response) {
    var data;
    if (request.params.folder2) {
      data = fs.readFileSync('./js/' + request.params.folder1 + '/' + request.params.folder2 + '/' + request.params.file);
    } else if (request.params.folder1) {
      data = fs.readFileSync('./js/' + request.params.folder1 + '/' + request.params.file);
    } else {
      data = fs.readFileSync('./js/' + request.params.file);
    }
    response.writeHead(200, {
      'Access-Control-Allow-Origin': '*',
      'Content-type': 'application/javascript'
    });
    response.write(data);
    return response.end();
  });

  app.get('/css/:file', function(request, response) {
    var data;
    data = fs.readFileSync('./css/' + request.params.file);
    response.writeHead(200, {
      'Access-Control-Allow-Origin': '*',
      'Content-type': 'text/css'
    });
    response.write(data);
    return response.end();
  });

  app.get('/appliances/fetch', function(request, response) {
    return database.getAppliances(function(appliances) {
      response.writeHead(200, {
        'Access-Control-Allow-Origin': '*'
      });
      response.write(JSON.stringify(appliances));
      return response.end();
    });
  });

  app.get('/appliance_usage/fetch', function(request, response) {
    return database.getApplianceUsage(request.query.user_id, function(appliance_usage) {
      response.writeHead(200, {
        'Access-Control-Allow-Origin': '*'
      });
      response.write(JSON.stringify(appliance_usage));
      return response.end();
    });
  });

  app.get('/img/:file', function(request, response) {
    var data;
    data = fs.readFileSync('./img/' + request.params.file);
    response.writeHead(200, {
      'Access-Control-Allow-Origin': '*',
      'Content-type': 'image/png'
    });
    response.write(data);
    return response.end();
  });

  app.get('/views/fetch', function(request, response) {
    var template, view;
    view = request.query.view;
    switch (view) {
      case "timer":
        template = "timer_view.html";
        break;
      case "summary":
        template = "summary_view.html";
        break;
      case "models":
        template = "model_views.html";
    }
    return fs.readFile("./views/" + template, function(error, template) {
      response.writeHead(200, {
        'Access-Control-Allow-Origin': '*'
      });
      response.write(template);
      return response.end();
    });
  });

  app.get('/timers/fetch', function(request, response) {
    return database.getTimers(request.query.user_id, function(timers) {
      var timer_data;
      response.writeHead(200, {
        'Access-Control-Allow-Origin': '*'
      });
      timer_data = calculator.calculateTerminatedUsage(timers);
      response.write(JSON.stringify(timer_data));
      return response.end();
    });
  });

  app.get('/tariff_selector_data/fetch', function(request, response) {
    response.writeHead(200, {
      'Access-Control-Allow-Origin': '*'
    });
    return database.getRegions(function(region_data) {
      return database.getProviders(function(provider_data) {
        return database.getTariffData('*', function(tariff_data) {
          var tariff_selector_data;
          tariff_selector_data = {
            region_data: region_data,
            provider_data: provider_data,
            tariff_data: tariff_data
          };
          response.write(JSON.stringify(tariff_selector_data));
          return response.end();
        });
      });
    });
  });

  app.post('/timer/storeTimestamp', function(request, response) {
    var appliance_id, data, is_active, timestamp, user_id;
    response.writeHead(200, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    timestamp = request.body.timestamp;
    appliance_id = request.body.appliance_id;
    is_active = request.body.is_active;
    is_active = (parseInt(is_active) + 1) % 2;
    user_id = request.body.user_id;
    database.appendTimeStamp(user_id, appliance_id, is_active, timestamp);
    data = {
      is_active: is_active
    };
    response.write(JSON.stringify(data));
    return response.end();
  });

  app.all('/users/save', function(request, response) {
    var provider_id, region_id, tariff_id, user_id;
    response.writeHead(200, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    user_id = request.body.user_id;
    region_id = request.body.region_id;
    provider_id = request.body.provider_id;
    tariff_id = request.body.tariff_id;
    return database.saveUserData(user_id, region_id, provider_id, tariff_id, function(status) {
      response.write(JSON.stringify(status));
      return response.end();
    });
  });

  app.get('/users/generateId', function(request, response) {
    var user_id;
    response.writeHead(200, {
      'Access-Control-Allow-Origin': '*'
    });
    user_id = user_id_generator.generate();
    user_id = '2a550081-364e-4aa5-b438-4b21f60c158e';
    response.write(JSON.stringify(user_id));
    return response.end();
  });

  app.get('/users/fetch/:user_id', function(request, response) {
    var user_id;
    response.writeHead(200, {
      'Access-Control-Allow-Origin': '*'
    });
    console.log("erere?");
    user_id = request.params.user_id;
    return database.getUserData(user_id, function(user_data) {
      response.write(JSON.stringify(user_data[0]));
      return response.end();
    });
  });

  app.get('/comparisons/generate', function(request, response) {
    var end_point, user_id;
    response.writeHead(200, {
      'Access-Control-Allow-Origin': '*'
    });
    user_id = request.query.user_id;
    end_point = request.query.timestamp;
    console.log("query!! " + request.query.user_id);
    return database.getTimers(user_id, function(timers) {
      return database.getRewards(function(reward_data) {
        return database.getAppliances(function(appliance_data) {
          return database.getUserData(user_id, function(user_data) {
            return database.getTariffData(user_data.region_id, function(tariff_data) {
              var comparison_data, data, timer_data;
              timer_data = calculator.calculateTerminatedUsage(timers);
              data = {
                timer_data: timer_data,
                end_point: end_point,
                tariff_data: tariff_data,
                user_data: _.first(user_data),
                reward_data: reward_data,
                appliance_data: appliance_data
              };
              comparison_data = calculator.calculateComparisons(data);
              response.write(JSON.stringify(comparison_data));
              return response.end();
            });
          });
        });
      });
    });
  });

}).call(this);
