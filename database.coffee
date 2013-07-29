mysql = require 'mysql'

connection = ""

exports.connect = (host, user, password, database) ->
	console.log(host, user, password, database)
	connection = mysql.createConnection {
		host : host
		user : user
		password : password
		database : database
	}
	connection.connect (error) ->
		if error
			throw error
	
exports.getAppliances = (callback) ->
	connection.query 'SELECT * FROM appliances WHERE 1 ORDER BY name ASC', (error,rows,fields) ->
		if error
			throw error
		else
			console.log rows
			callback rows
			return
	
exports.getRewards = (callback) ->
	connection.query "SELECT * FROM rewards", (error,rows,fields) ->
		if error
			throw error
		else
			callback rows
			return

exports.getUserData = (user_id, callback) ->
	connection.query "SELECT region_id, provider_id, start_timestamp, tariff_id FROM users WHERE user_id = '"+user_id+"'", (error,rows,fields) ->
		if error
			throw error
		else
			callback rows
			return
			
exports.createUserData = (user_id, start_timestamp, callback) ->
	console.log "INSERT INTO users VALUES ('"+user_id+"', '"+start_timestamp+"', 10, 1, 1)"
	connection.query "INSERT INTO users VALUES ('"+user_id+"', '"+start_timestamp+"', 10, 1, 1)", (error,rows,fields) ->
		if error
			throw error
		else
			callback "success"
			return

exports.saveUserData = (user_id, region_id, provider_id, tariff_id, callback) ->			
	connection.query "UPDATE users SET region_id = '"+region_id+"', provider_id = '"+provider_id+"', tariff_id = '"+tariff_id+"' WHERE user_id = '"+user_id+"'", (error,rows,fields) ->
		if error
			throw error
		else
			callback "success"
			return	
			
exports.deleteUserData = (user_id, callback) ->
	connection.query "DELETE FROM users WHERE user_id = '"+user_id+"'", (error,rows,fields) ->
		if error
			throw error
		else
			connection.query "DELETE FROM timers WHERE user_id = '"+user_id+"'", (error,rows,fields) ->
				if error
					throw error

			callback "success"
			return	
	
exports.getTariffData = (region_id, callback) ->

	if region_id = '*'
		query = "SELECT * FROM tariffs WHERE region_id LIKE '%'"
	else
		query = "SELECT * FROM tariffs WHERE region_id = '"+region_id+"'"
		
	connection.query query, (error,rows,fields) ->
		if error
			throw error
		else
			callback rows
			return
					
exports.getTimers = (user_id, callback) ->
	connection.query "SELECT appliance_id, is_active, timestamp_string FROM timers WHERE user_id = '"+user_id+"'", (error,rows,fields) ->
		if error
			throw error
		else
			console.log rows
			callback rows
			return
			
exports.getUserData = (user_id, callback) ->
	connection.query "SELECT * FROM users WHERE user_id = '"+user_id+"'", (error,rows,fields) ->
		if error
			throw error
		else
			console.log rows
			callback rows
			return

exports.getRegions = (callback) ->

	connection.query "SELECT * FROM regions", (error,rows,fields) ->
		if error
			throw error
		else
			console.log rows
			callback rows
			return			

exports.getProviders = (callback) ->

	connection.query "SELECT * FROM providers", (error,rows,fields) ->
		if error
			throw error
		else
			console.log rows
			callback rows
			return			
						
exports.appendTimeStamp = (user_id, appliance_id, is_active, timestamp, callback) ->

	connection.query "SELECT COUNT(appliance_id) AS count FROM timers WHERE user_id = '"+user_id+"' AND appliance_id = "+appliance_id, (error, rows, fields) ->
		if error 
			throw error
		if rows[0].count > 0
			console.log "here with " + user_id
			connection.query "SELECT timestamp_string FROM timers WHERE user_id = '"+user_id+"' AND appliance_id = "+appliance_id, (error, rows, fields) ->
			
				timestamp_string = rows[0].timestamp_string+","+timestamp
				
				connection.query "UPDATE timers SET timestamp_string = '"+timestamp_string+"', is_active = "+is_active+" WHERE user_id = '"+user_id+"' AND appliance_id = '"+appliance_id+"'", (error, rows, fields) ->
					if error 
						throw error
		else
			connection.query "INSERT INTO timers VALUES ('" + user_id + "'," + appliance_id + ",1,"+timestamp+")", (error, rows, fields) ->
				console.log user_id
				if error 
					throw error
		callback
		return

#exports.updateDisplay = (user_id, appliance_id, is_displayed, callback) ->
#
#	connection.query "SELECT COUNT(appliance_id) AS count FROM timers WHERE user_id = '"+user_id+"' AND appliance_id = "+appliance_id, (error, rows, fields) ->
#		if error 
#			throw error
#		if rows[0].count > 0
#			console.log "here with " + user_id
#			connection.query "UPDATE timers SET is_displayed = "+is_displayed+" WHERE user_id = '"+user_id+"' AND appliance_id = '"+appliance_id+"'", (error, rows, fields) ->
#			if error 
#				throw error
#		else
#			connection.query "INSERT INTO timers VALUES ('" + user_id + "'," + appliance_id + ",0, 1,'')", (error, rows, fields) ->
#				console.log user_id
#				if error 
#					throw error
#		callback
#		return

exports.save = (model, data) ->
	#if model == applianceUsage
	#	databaseConnection.query 'SELECT * FROM PRODUCTS WHERE 1', (err,rows,fields) ->
	#	if err 
	#		throw err
	#	else
	#		console.log rows