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
	user_data = data.user_data
	reward_data = data.reward_data
	appliance_data = data.appliance_data

	tariff_data = _.filter data.tariff_data, (tariff) ->
		return tariff.region_id == user_data.region_id
	
	appliance_spend = Array()
	
	for timer in timer_data
		console.log "here once?"
		total_timestamp = timer.total_timestamp
		if timer.is_active == 1
			start_timestamp = timer.start_timestamp
			total_timestamp += end_point - start_timestamp
			timer.total_timestamp = total_timestamp
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
	
	#usage_fractions = Array()
	user_tariff = _.find tariff_data, (tariff) ->
		tariff.tariff_id == user_spend.tariff_id
	user_appliance_spend = _.filter appliance_spend, (spend) ->
		spend.tariff_id == user_spend.tariff_id
		
	#console.log "user appliance spend"
	#console.log user_appliance_spend
	#console.log "ended"	
	
	#_.each user_appliance_spend, (spend) ->
	#	console.log spend.total_spend+" "+user_spend.tariff_spend+" "
	#	console.log user_tariff
	#	usage_fractions.push 
	#		appliance_id : spend.appliance_id
	#		fraction : spend.total_spend / (user_spend.tariff_spend - parseFloat(user_tariff.standing_charge))
	#	#console.log spend.total_spend+","+user_spend.tariff_spend 
	
	#console.log "usage_fractions"
	#console.log usage_fractions
	#sort cheapest into ascending order
	
	cheapest_tariffs = _.sortBy cheapest_tariffs, (tariff) ->
		tariff.tariff_spend
	
	#console.log cheapest_tariffs
	#console.log user_tariff
	
	comparison_data = Array()
	_.each cheapest_tariffs, (tariff) ->
		#console.log tariff.tariff_spend+" "+user_spend.tariff_spend
		if tariff.tariff_spend < user_spend.tariff_spend
			appliance_usages = Array()
			
			console.log "tariff spend : "+parseFloat(tariff.tariff_spend)
			console.log "user_tariff standing charge : "+parseFloat(user_tariff.standing_charge)
			console.log "user_spend tariff_spend : "+parseFloat(user_spend.tariff_spend)
			console.log "user tariff standing charge : "+parseFloat(user_tariff.standing_charge)
			
			if tariff.tariff_spend - user_tariff.standing_charge <= 0
				reduction_fraction = 1
			else
				reduction_fraction = (parseFloat(tariff.tariff_spend) - parseFloat(user_tariff.standing_charge)) /(parseFloat(user_spend.tariff_spend) - parseFloat(user_tariff.standing_charge))
			
			_.each timer_data, (timer) ->
			
				#spend = _.map _.find appliance_spend, (spend) ->
				#	return appliance_spend.appliance_id == timer.appliance_id
				#, (spend) ->
				#	return spend.total_spend

				spend = _.find user_appliance_spend, (spend) ->
					return spend.appliance_id == timer.appliance_id
					
				spend_target = parseFloat(spend.total_spend) * reduction_fraction
				console.log "reduction_fraction is "+reduction_fraction
				appliance =  _.find appliance_data, (appliance) ->
					return appliance.appliance_id == timer.appliance_id

				console.log "spend target is "+spend_target+" for "+appliance.appliance_id
					
				wattage = parseFloat appliance.wattage	
					
				unit_rate = parseFloat user_tariff.unit_rate
				
				#reduced_timestamp = (spend_target * 1000) / (unitRate * wattage) * (60*60*1000))
				#reduced_timestamp = ((spend_target * 1000) / (wattage * unit_rate)) * (60*60*1000)
				#reduced_timestamp = ((parseFloat(spend.total_spend) * 1000) / (wattage * unit_rate)) * (60*60*1000)
				reduced_timestamp = ((spend_target * 1000) / (wattage * unit_rate)) * (60*60*1000)
				reduction_timestamp = parseFloat(timer.total_timestamp) - reduced_timestamp
			
				console.log "total timestamp = "+timer.total_timestamp+", reduced is "+reduced_timestamp
			
				#usage_fraction = _.find usage_fractions, (fraction) ->
				#	fraction.appliance_id == timer.appliance_id
				
				#reduction_timestamp =  parseFloat(timer.total_timestamp) - ((parseFloat(timer.total_timestamp) * parseFloat(usage_fraction.fraction)) * (  ) )
				appliance_usages.push
					appliance_id : timer.appliance_id
					reduction_timestamp : reduction_timestamp
					
			daily_saving = user_spend.tariff_spend - tariff.tariff_spend
			yearly_saving = daily_saving * 365
			alternate_tariff = _.find tariff_data, (_tariff) ->
				tariff.tariff_id == _tariff.tariff_id
			saving_reward = _.max reward_data, (reward) ->
				console.log "reward cost "+reward.cost+", yearly saving "+yearly_saving
				if reward.cost <= yearly_saving
					return reward.cost
				else
					return -1
			#console.log appliance_usages
			tariff_comparison = 
				comparison_id : tariff.tariff_id
				appliance_usages : appliance_usages
				daily_saving : daily_saving.toFixed 2
				yearly_saving : yearly_saving.toFixed 2
				alternate_tariff : alternate_tariff
				saving_reward : saving_reward
				appliance_data : appliance_data
			comparison_data.push tariff_comparison
	
	#console.log comparison_data
			
	return comparison_data