mysql = require 'mysql'

connection = ""
host = ""
user = ""
password = ""
database = ""

exports.createConnection = (_host, _user, _password, _database) ->
	host = _host
	user = _user
	password = _password
	database = _database
	
	connection = mysql.createConnection {
		host : host
		user : user
		password : password
		database : database
	}

#exports.connect =  ->
#	connection.connect (error) ->
#		if error
#			throw error

#exports.disconnect = ->
#	connection.end()
	
exports.getAppliances = (callback) ->
	#exports.connect()
	connection.query 'SELECT * FROM appliances WHERE 1 ORDER BY name ASC', (error,rows,fields) ->
		#exports.disconnect()
		if error
			throw error
		else
			console.log rows
			callback rows
			return
	
exports.getRewards = (callback) ->
	#exports.connect()
	connection.query "SELECT * FROM rewards", (error,rows,fields) ->
		#exports.disconnect()
		if error
			throw error
		else
			callback rows
			return

exports.getUserData = (user_id, callback) ->
	#exports.connect()
	connection.query "SELECT region_id, provider_id, start_timestamp, tariff_id FROM users WHERE user_id = '"+user_id+"'", (error,rows,fields) ->
		#exports.disconnect()
		if error
			throw error
		else
			callback rows
			return
			
exports.createUserData = (user_id, start_timestamp, callback) ->
	console.log "INSERT INTO users VALUES ('"+user_id+"', '"+start_timestamp+"', 11, 1, 6)"
	#exports.connect()
	connection.query "INSERT INTO users VALUES ('"+user_id+"', '"+start_timestamp+"', 11, 1, 6)", (error,rows,fields) ->
		#exports.disconnect()
		if error
			throw error
		else
			callback "success"
			return

exports.saveUserData = (user_id, region_id, provider_id, tariff_id, callback) ->			
	#exports.connect()
	connection.query "UPDATE users SET region_id = '"+region_id+"', provider_id = '"+provider_id+"', tariff_id = '"+tariff_id+"' WHERE user_id = '"+user_id+"'", (error,rows,fields) ->
		#exports.disconnect()
		if error
			throw error
		else
			callback "success"
			return	
			
exports.deleteUserData = (user_id, callback) ->
	#exports.connect()
	connection.query "DELETE FROM users WHERE user_id = '"+user_id+"'", (error,rows,fields) ->
		if error
			throw error
		else
			connection.query "DELETE FROM timers WHERE user_id = '"+user_id+"'", (error,rows,fields) ->
				#exports.disconnect()
				if error
					throw error

			callback "success"
			return	
	
exports.getTariffData = (region_id, callback) ->

	if region_id = '*'
		query = "SELECT * FROM tariffs WHERE region_id LIKE '%'"
	else
		query = "SELECT * FROM tariffs WHERE region_id = '"+region_id+"'"
		
	#exports.connect()	
	connection.query query, (error,rows,fields) ->
		#exports.disconnect()
		if error
			throw error
		else
			callback rows
			return
					
exports.getTimers = (user_id, callback) ->
	#exports.connect()
	connection.query "SELECT appliance_id, is_active, timestamp_string FROM timers WHERE user_id = '"+user_id+"'", (error,rows,fields) ->
		#exports.disconnect()
		if error
			throw error
		else
			console.log rows
			callback rows
			return
			
exports.getUserData = (user_id, callback) ->
	#exports.connect()
	connection.query "SELECT * FROM users WHERE user_id = '"+user_id+"'", (error,rows,fields) ->
		#exports.disconnect()
		if error
			throw error
		else
			console.log rows
			callback rows
			return

exports.getRegions = (callback) ->
	#exports.connect()
	connection.query "SELECT * FROM regions", (error,rows,fields) ->
		#exports.disconnect()
		if error
			throw error
		else
			console.log rows
			callback rows
			return			

exports.getProviders = (callback) ->
	#exports.connect()
	connection.query "SELECT * FROM providers", (error,rows,fields) ->
		#exports.disconnect()
		if error
			throw error
		else
			console.log rows
			callback rows
			return			
						
exports.appendTimeStamp = (user_id, appliance_id, is_active, timestamp, callback) ->
	#exports.connect()
	connection.query "SELECT COUNT(appliance_id) AS count FROM timers WHERE user_id = '"+user_id+"' AND appliance_id = "+appliance_id, (error, rows, fields) ->
		if error 
			throw error
		if rows[0].count > 0
			connection.query "SELECT timestamp_string FROM timers WHERE user_id = '"+user_id+"' AND appliance_id = "+appliance_id, (error, rows, fields) ->
				if error
					throw error
				else
					timestamp_string = rows[0].timestamp_string+","+timestamp
				
					connection.query "UPDATE timers SET timestamp_string = '"+timestamp_string+"', is_active = "+is_active+" WHERE user_id = '"+user_id+"' AND appliance_id = '"+appliance_id+"'", (error, rows, fields) ->
				#	exports.disconnect()
						if error 
							throw error
		else
			connection.query "INSERT INTO timers VALUES ('" + user_id + "'," + appliance_id + ",1,"+timestamp+")", (error, rows, fields) ->
				console.log user_id
				#exports.disconnect()
				if error 
					throw error
		callback "success"
		return