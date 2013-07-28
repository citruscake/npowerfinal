window.formatTimestamp = (timestamp) ->
	time = new Date timestamp
	formatted_hours = String time.getHours()
	formatted_minutes = String time.getMinutes()
	formatted_seconds = String time.getSeconds()
	#formatted_milliseconds = String time.getMilliseconds()		
	
	if (formatted_hours.length) < 2
		formatted_hours = "0" + formatted_hours
	if (formatted_minutes.length) < 2
		formatted_minutes = "0" + formatted_minutes
	if (formatted_seconds.length) < 2
		formatted_seconds = "0" + formatted_seconds
	#if (formatted_milliseconds.length) < 2
	#	formatted_milliseconds = "00" + formatted_milliseconds
	#else if (formatted_milliseconds.length) < 3
	#	formatted_milliseconds = "0" + formatted_milliseconds
	formatted_time = formatted_hours + ":" + formatted_minutes + ":" + formatted_seconds
	#+ ":" + formatted_milliseconds
		
window.formatCurrency = (amount) ->
	"&#163;" + String amount.toFixed(2)