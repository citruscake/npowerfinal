#https://github.com/caolan/async use this later!

express = require 'express'
fs = require 'fs'
http = require 'http'
database = require './custom_modules/database'
calculator = require './custom_modules/calculator'
user_id_generator = require './custom_modules/user_id_generator'
socket = require 'socket.io'
config = require './custom_modules/config'

#console.log config.data.host
if process.env.VCAP_SERVICES
	env = JSON.parse process.env.VCAP_SERVICES
	config = env['mysql-5.1'][0]['credentials']
	database.connect config.hostname, config.username, config.password, config.db
else
	database.connect config.data.host, config.data.username, config.data.password, config.data.database

app = express()
app.use require('connect').bodyParser()
server = http.createServer app
io = socket.listen server
#server.listen (config.data.port || process.env.VCAP_APP_PORT)
server.listen (process.env.VCAP_APP_PORT || 3000)

app.get '/', (req, res) ->
    res.send('Hello from AppFog')

###
io.sockets.on 'connection', (socket) ->
	socket.on 'clientUserId', (user_id, callback) ->
		socket.set 'user_id', user_id, ->
			console.log user_id
			callback
			return
		
	socket.on 'displayToggle', (data) ->
		is_displayed = data.is_displayed
		appliance_id = data.appliance_id
	
		socket.get 'user_id', (error, user_id) ->
			database.updateDisplay user_id, appliance_id, is_displayed
			socket.emit 'displayToggle', appliance_id, is_displayed
		return
		
	socket.on 'generateUserId', ->
		user_id = user_id_generator.generate()
		user_id = '2a550081-364e-4aa5-b438-4b21f60c158e'
		socket.set 'user_id', user_id, ->
			console.log user_id
			socket.emit 'receiveUserId', user_id
		
app.get '/appliances/fetch', (request, response) ->

	database.getAppliances (appliances) ->
		response.writeHead 200, 
			'Access-Control-Allow-Origin' : '*'
		response.write JSON.stringify(appliances)
		response.end()
		
app.get '/appliance_usage/fetch', (request, response) ->

	database.getApplianceUsage (request.query.user_id), (appliance_usage) ->
		response.writeHead 200, 
			'Access-Control-Allow-Origin' : '*'
		response.write JSON.stringify(appliance_usage)
		response.end()
		
app.get '/views/fetch', (request, response) ->
	view = request.query.view
	switch view
		when "realtime" then template = "realtime_view.html"
		when "timeline" then template = "timeline_view.html"
		when "models" then template = "model_views.html"
		
	fs.readFile "./views/"+template, (error, template) ->
		#console.log template
		response.writeHead 200, 
			'Access-Control-Allow-Origin' : '*'
		response.write template
		response.end()
		
app.get '/timers/fetch', (request, response) ->
		database.getTimers (request.query.user_id), (timers) ->
			response.writeHead 200, 
				'Access-Control-Allow-Origin' : '*'
			timer_data = calculator.calculateTerminatedUsage(timers)
			response.write JSON.stringify(timer_data)
			response.end()

app.all '/timer/update/display', (request, response) ->

	response.writeHead 200, 
		'Access-Control-Allow-Origin' : '*'
		'Access-Control-Allow-Methods' : 'PUT'
		'Access-Control-Allow-Headers' : 'Content-Type'
	
	if request.body.appliance_id != undefined 
		is_displayed = request.body.is_displayed
		appliance_id = request.body.appliance_id
		user_id = request.body.user_id
	
		database.updateDisplay user_id, appliance_id, is_displayed, (status) ->
		
		response.end()
	else
		response.end()

app.post '/timer/storeTimestamp', (request, response) ->
	response.writeHead 200, 
		'Access-Control-Allow-Origin' : '*'
		'Access-Control-Allow-Methods' : 'POST'
		'Access-Control-Allow-Headers' : 'Content-Type'
	
	#timestamp = new Date().getTime()
	timestamp = request.body.timestamp
	appliance_id = request.body.appliance_id
	is_active = request.body.is_active
	is_active = (parseInt(is_active) + 1) % 2
	user_id = request.body.user_id
	database.appendTimeStamp user_id, appliance_id, is_active, timestamp
		
	data =
		is_active : is_active
		
	response.write JSON.stringify data
	response.end()

app.get '/comparisons/generate', (request, response) ->
	response.writeHead 200, 
		'Access-Control-Allow-Origin' : '*'
		'Access-Control-Allow-Methods' : 'POST'
		'Access-Control-Allow-Headers' : 'Content-Type'
	
	user_id = request.query.user_id
	end_point = request.query.timestamp
	console.log "query!! "+request.query.user_id
	
	database.getTimers (user_id), (timers) ->
		database.getRewards (reward_data) ->
			database.getAppliances (appliance_data) ->
				database.getUserData (user_id), (user_data) ->
					database.getTariffData (user_data[0].region_id), (tariff_data) ->
				
						timer_data = calculator.calculateTerminatedUsage(timers)
									
						data =
							timer_data : timer_data
							end_point : end_point
							tariff_data : tariff_data
							user_data : user_data[0]
							reward_data : reward_data
							appliance_data : appliance_data
							
						console.log data
				
						comparison_data = calculator.calculateComparisons (data)
						response.write JSON.stringify comparison_data
						response.end()
###