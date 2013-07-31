window.formatTimestamp = (timestamp, toString=true, includeMilliseconds=true) ->
	time = new Date timestamp
	formatted_hours = String time.getHours()
	formatted_minutes = String time.getMinutes()
	formatted_seconds = String time.getSeconds()
	formatted_milliseconds = String time.getMilliseconds()
	
	#if (formatted_hours.length) < 2 && toString == true
		#formatted_hours = "0" + formatted_hours
	#if (formatted_minutes.length) < 2 && toString == true
		#formatted_minutes = "0" + formatted_minutes
	#if (formatted_seconds.length) < 2  && toString == true
		#formatted_seconds = "0" + formatted_seconds
	#if (formatted_milliseconds.length) < 2
		#formatted_milliseconds = "00" + formatted_milliseconds
	#else if (formatted_milliseconds.length) < 3
	#	formatted_milliseconds = "0" + formatted_milliseconds
	
	if toString == true
		#formatted_time = formatted_hours + ":" + formatted_minutes + ":" + formatted_seconds + ":" + formatted_milliseconds
		formatted_time = formatted_hours + "h " + formatted_minutes + "m " + formatted_seconds + "s "
		if (includeMilliseconds == true)
			formatted_time +=  formatted_milliseconds + "ms"
	else
		formatted_time = Array()
		if parseInt(formatted_hours) > 0
			formatted_time.push formatted_hours
		else
			formatted_time.push ""
		
		if parseInt(formatted_minutes) > 0
			formatted_time.push formatted_minutes
		else
			formatted_time.push ""
			
		if parseInt(formatted_seconds) > 0
			formatted_time.push formatted_seconds
		else
			formatted_time.push ""
		
		if (includeMilliseconds == true)
			if parseInt(formatted_milliseconds) > 0
				formatted_time.push formatted_milliseconds
			else
				formatted_time.push ""

	return formatted_time
		
window.formatCurrency = (amount, toFixed=2) ->
	currency_string = "&#163;"+String(amount.toFixed(toFixed))

	return currency_string
