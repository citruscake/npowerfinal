#https://github.com/caolan/async use this later!

express = require 'express'
fs = require 'fs'
http = require 'http'
_ = require 'underscore'

config_db = ""
config_username = ""
config_password = ""
config_host = ""

database = require './custom_modules/database'
calculator = require './custom_modules/calculator'
user_id_generator = require './custom_modules/user_id_generator'

#console.log config.data.host
if process.env.VCAP_SERVICES
	env = JSON.parse process.env.VCAP_SERVICES
	config = env['mysql-5.1'][0]['credentials']
	#database.connect config.hostname, config.username, config.password, config.db
	config_db = config.db
	config_username = config.username
	config_password = config.password
	config_host = config.hostname
else
	config = require './custom_modules/config'
	#database.connect config.data.host, config.data.username, config.data.password, config.data.database
	config_db = config.data.database
	config_username = config.data.username
	config_password = config.data.password
	config_host = config.data.host
	
database.createConnection config_host, config_username, config_password, config_db

app = express()
app.use require('connect').bodyParser()
server = http.createServer app
#server.listen (config.data.port || process.env.VCAP_APP_PORT)
server.listen (process.env.VCAP_APP_PORT || 3000)

#app.get '/', (reqywar, res) ->
#    res.send('Hello from AppFog')

app.get '/', (request, response) ->
	fs.readFile './views/index.html', (error, view) ->
		response.writeHead 200,
			'Access-Control-Allow-Origin' : '*'
		#response.write view
		response.write view
		console.log view
		response.end()

app.get '/already_open', (request, response) ->
	response.writeHead 200,
			'Access-Control-Allow-Origin' : '*'
	response.write "You have a page already open, please use only one instance at a time to prevent errors.\n\n"
	response.write "If you cannot access the app then your browser may have not been closed properly in your last session. Try clearing your cookies "
	response.write "and the problem should solve itself."
	response.end()
	
app.get '/js/:folder1?/:folder2?/:file', (request, response) ->
	if request.params.folder2
		data = fs.readFileSync './js/'+request.params.folder1+'/'+request.params.folder2+'/'+request.params.file
	else if request.params.folder1
		data = fs.readFileSync './js/'+request.params.folder1+'/'+request.params.file
	else
		data = fs.readFileSync './js/'+request.params.file
	response.writeHead 200,
		'Access-Control-Allow-Origin' : '*',
		'Content-type' : 'application/javascript'
	response.write data
	response.end()

app.get '/css/:file', (request, response) ->	
	data = fs.readFileSync './css/'+request.params.file
	response.writeHead 200,
		'Access-Control-Allow-Origin' : '*',
		'Content-type' : 'text/css'
	response.write data
	response.end()

app.get '/fonts/:file', (request, response) ->	
	data = fs.readFileSync './fonts/'+request.params.file
	response.writeHead 200,
		'Access-Control-Allow-Origin' : '*',
	response.write data
	response.end()
	
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

app.get '/img/:file', (request, response) ->
	data = fs.readFileSync './img/'+request.params.file
	response.writeHead 200,
		'Access-Control-Allow-Origin' : '*',
		'Content-type' : 'image/png'
	response.write data
	response.end()
		
app.get '/views/fetch', (request, response) ->
	view = request.query.view
	switch view
		when "timer" then template = "timer_view.html"
		when "summary" then template = "summary_view.html"
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
		timer_data = calculator.calculateTerminatedUsage timers
		response.write JSON.stringify timer_data
		response.end()

app.get '/tariff_selector_data/fetch', (request, response) ->
	response.writeHead 200, 
		'Access-Control-Allow-Origin' : '*'
		
	database.getRegions (region_data) ->
		database.getProviders (provider_data) ->
			database.getTariffData ('*'), (tariff_data) ->
				tariff_selector_data =
					region_data : region_data
					provider_data : provider_data
					tariff_data : tariff_data
				response.write JSON.stringify tariff_selector_data
				response.end()

app.post '/timer/storeTimestamp', (request, response) ->
	response.writeHead 200, 
		'Access-Control-Allow-Origin' : '*'
		'Access-Control-Allow-Methods' : 'POST'
		'Access-Control-Allow-Headers' : 'Content-Type'
	
	#timestamp = new Date().getTime()
	timestamp = request.body.timestamp
	if request.body.timestamp == undefined
		timestamp = new Date().getTime() #may not be the right time but better than undefined
	appliance_id = request.body.appliance_id
	is_active = request.body.is_active
	is_active = (parseInt(is_active) + 1) % 2
	user_id = request.body.user_id
	
	database.appendTimeStamp user_id, appliance_id, is_active, timestamp, (status) ->

		data =
			is_active : is_active
		
		response.write JSON.stringify data
		response.end()

app.all '/users/save', (request, response) ->
	response.writeHead 200, 
		'Access-Control-Allow-Origin' : '*'
		'Access-Control-Allow-Methods' : 'POST'
		'Access-Control-Allow-Headers' : 'Content-Type'
		
	user_id = request.body.user_id
	region_id = request.body.region_id
	provider_id = request.body.provider_id
	tariff_id = request.body.tariff_id
	database.saveUserData user_id, region_id, provider_id, tariff_id, (status) ->
		response.write JSON.stringify status
		response.end()
			
app.all '/users/delete', (request, response) ->
	response.writeHead 200, 
		'Access-Control-Allow-Origin' : '*'
		'Access-Control-Allow-Methods' : 'POST'
		'Access-Control-Allow-Headers' : 'Content-Type'
	
	user_id = request.body.user_id
	console.log request.body

	database.deleteUserData user_id, (status) ->

		response.write JSON.stringify status
		response.end()
	
app.all '/users/create', (request, response) ->
	console.log "creating user"
	response.writeHead 200,
		'Access-Control-Allow-Origin' : '*'
	user_id = user_id_generator.generate()
	start_timestamp = request.body.start_timestamp
	#user_id = '2a550081-364e-4aa5-b438-4b21f60c158e'

	database.createUserData user_id, start_timestamp, (status) ->

		response.write JSON.stringify user_id
		response.end()

app.get '/users/fetch/:user_id', (request, response) ->
	response.writeHead 200, 
		'Access-Control-Allow-Origin' : '*'
	console.log "erere?"
	user_id = request.params.user_id

	database.getUserData (user_id), (user_data) ->

		response.write JSON.stringify user_data[0]
		response.end()
	
app.get '/comparisons/generate', (request, response) ->
	response.writeHead 200, 
		'Access-Control-Allow-Origin' : '*'
						
	user_id = request.query.user_id
	end_point = request.query.timestamp
	console.log "query!! "+request.query.user_id
	
	database.getTimers (user_id), (timers) ->
		database.getRewards (reward_data) ->
			database.getAppliances (appliance_data) ->
				database.getUserData (user_id), (user_data) ->
					database.getTariffData (user_data.region_id), (tariff_data) ->
						#console.log "user_id is "+user_id
				
						timer_data = calculator.calculateTerminatedUsage(timers)
									
						data =
							timer_data : timer_data
							end_point : end_point
							tariff_data : tariff_data
							user_data :  _.first user_data
							reward_data : reward_data
							appliance_data : appliance_data
							
						#console.log data
				
						comparison_data = calculator.calculateComparisons (data)
						response.write JSON.stringify comparison_data
						response.end()