_ = require 'underscore'

exports.calculateTerminatedUsage = (timers) ->
	timer_data = Array()
	for timer in timers
		timestamp_string = timer.timestamp_string
		total_timestamp = 0
		if timer.timestamp_string != ""
			timestamps = timestamp_string.split ","
			for i in [0...timestamps.length]
				console.log "i here"
				if i % 2 == 0 #start of a timer
					if i+1 < timestamps.length #end of timer exists
						#if timestamps[i+1] >= cutoff and timestamps[i] >= cutoff 
						total_timestamp += timestamps[i+1] - timestamps[i]
						#else if timestamps[i+1] >= cutoff and timestamps[i] < cutoff
						#	total_timestamp += timestamps[i+1] - cutoff

			if timestamps.length % 2 == 1
				is_active = 1
			else
				is_active = 0
		else
			is_active = 0
			
		if is_active == 1
			start_timestamp = timestamps[timestamps.length-1]
		else
			start_timestamp = ''

		data =
			appliance_id : timer.appliance_id
			is_active : is_active
			total_timestamp : total_timestamp
			start_timestamp : start_timestamp

		timer_data.push data
	console.log "timer data "+timer_data
	return timer_data

exports.calculateComparisons = (data) ->

	timer_data = data.timer_data
	end_point = data.end_point
	tariff_data = data.tariff_data
	user_data = data.user_data
	reward_data = data.reward_data
	appliance_data = data.appliance_data

	appliance_spend = Array()
	
	for timer in timer_data
		console.log "here once?"
		total_timestamp = timer.total_timestamp
		if timer.is_active == 1
			start_timestamp = timer.start_timestamp
			total_timestamp += end_point - start_timestamp
		appliance_id = timer.appliance_id
		appliance = _.first _.filter appliance_data, (appliance) -> 
			appliance.appliance_id == appliance_id
		wattage = appliance.wattage

		for tariff in tariff_data
			tariff_id = tariff.tariff_id
			appliance_spend.push
				tariff_id : tariff_id
				appliance_id : appliance_id
				total_spend : ((total_timestamp / (60*60*1000)) * parseFloat(tariff.unit_rate) * parseFloat(wattage)) / 1000

	cheapest_tariffs = new Array()
	user_spend = ""
	
	console.log "am i here??"
	#console.log appliance_spend
	
	for tariff in tariff_data
		tariff_id = tariff.tariff_id
		tariff_appliance_spend = _.filter appliance_spend, (spend) ->
			spend.tariff_id == tariff_id
		console.log "tariff_appliance_spend"
		console.log tariff_appliance_spend
		tariff_spend = _.reduce tariff_appliance_spend, (memo, spend) ->
			memo += spend.total_spend
		,0

		tariff_spend += parseFloat tariff.standing_charge
		#console.log tariff_id
		#console.log user_data.tariff_id
		if tariff_id == user_data.tariff_id
			#console.log "setting user_spend"
			user_spend =	
				tariff_id : tariff_id
				tariff_spend : tariff_spend
		else
			if cheapest_tariffs.length < 5
				cheapest_tariffs.push 
					tariff_id : tariff_id
					tariff_spend : tariff_spend
			else
				highest_tariff = _.max cheapest_tariffs, (tariff) ->
					return tariff.tariff_spend
				if tariff_spend < highest_tariff.tariff_spend
					cheapest_tariffs = _.without cheapest_tariffs, highest_tariff
					cheapest_tariffs.push 
						tariff_id : tariff_id
						tariff_spend : tariff_spend

	console.log cheapest_tariffs
	
	usage_fractions = Array()
	user_tariff = _.first _.filter tariff_data, (tariff) ->
		tariff.tariff_id == user_spend.tariff_id
	user_appliance_spend = _.filter appliance_spend, (spend) ->
		spend.tariff_id == user_spend.tariff_id
		
	console.log "user appliance spend"
	console.log user_appliance_spend
	console.log "ended"	
	
	_.each user_appliance_spend, (spend) ->
		console.log spend.total_spend+" "+user_spend.tariff_spend+" "
		console.log user_tariff
		usage_fractions.push 
			appliance_id : spend.appliance_id
			fraction : spend.total_spend / (user_spend.tariff_spend - parseFloat(user_tariff.standing_charge))
		#console.log spend.total_spend+","+user_spend.tariff_spend 
	
	console.log usage_fractions
	#sort cheapest into ascending order
	cheapest_tariffs = _.sortBy cheapest_tariffs, (tariff) ->
		-tariff.tariff_spend
	
	console.log cheapest_tariffs
	#console.log user_tariff
	comparison_data = Array()
	_.each cheapest_tariffs, (tariff) ->
		#console.log tariff.tariff_spend+" "+user_spend.tariff_spend
		if tariff.tariff_spend < user_spend.tariff_spend
			appliance_usages = Array()
			_.each timer_data, (timer) ->
				usage_fraction = _.first _.filter usage_fractions, (fraction) ->
					fraction.appliance_id == timer.appliance_id
				
				reduction_timestamp =  parseFloat(timer.total_timestamp) - ((parseFloat(timer.total_timestamp) * parseFloat(usage_fraction.fraction)) * ( (parseFloat(tariff.tariff_spend) - parseFloat(user_tariff.standing_charge)) /(parseFloat(user_spend.tariff_spend) - parseFloat(user_tariff.standing_charge)) ) )
				appliance_usages.push
					appliance_id : timer.appliance_id
					reduction_timestamp : reduction_timestamp
					
			daily_saving = user_spend.tariff_spend - tariff.tariff_spend
			yearly_saving = daily_saving * 365
			alternate_tariff = _.first _.filter tariff_data, (_tariff) ->
				tariff.tariff_id == _tariff.tariff_id
			saving_reward = _.max reward_data, (reward) ->
				reward.cost <= yearly_saving
			console.log appliance_usages
			tariff_comparison = 
				comparison_id : tariff.tariff_id
				appliance_usages : appliance_usages
				daily_saving : daily_saving.toFixed 2
				yearly_saving : yearly_saving.toFixed 2
				alternate_tariff : alternate_tariff
				saving_reward : saving_reward
			comparison_data.push tariff_comparison
	
	console.log comparison_data
			
	return comparison_data