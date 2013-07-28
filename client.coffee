$ ->

	summary_view = null
	timer_view = null
	applianceCollection = null 
	applianceCollectionView = null
	timerCollection = null
	timerCollectionView = null
	comparisonCollection = null
	comparisonCollectionView = null	
	window.user = null
	window.tariff = null
	current_page = null
	
	in_use = $.cookie 'in_use'
	if in_use == 'true'
		window.location.href = "/already_open"
	else
		$.cookie 'in_use', 'true', 
			expires : 7
	
	window.onbeforeunload = ->
		$.removeCookie 'in_use'
		return null
	
	#window.user_id = '2a550081-364e-4aa5-b438-4b21f60c158e'
			
	fetchModels = ->

		applianceCollection.fetch
			success : (collection,response) ->
				console.log applianceCollection.models
				timerCollection.fetch
					data :
						user_id : window.user.get 'user_id'
					success : (collection,response) ->
						timerCollection.addDummyTimers applianceCollection.models
						$('#timer_view_link').trigger 'click'
						current_page = "timer"
						#$('#info_frame_link').trigger 'click'
						initialiseInfoFrameCloseFunctionality()
					error : (h,response) ->	
			error : (h,response) ->
			
	initialiseInfoFrameCloseFunctionality = ->		
			
		$('#info_frame_close_link').on 'click' : (event) ->
			$('#info_frame_container').animate
				opacity : 0
			, 200, 'easeOutSine'
			, ->
				$('#info_frame_container').css 'top', '-1000px'
				$('body').css "overflow", "visible"
			
		return false
	
	initialisePageCalculator = ->

		unit_rate = window.tariff.unit_rate
	
		for timer in timerCollection.models
			appliance_id = timer.get 'appliance_id'
			appliance = applianceCollection.get appliance_id
			wattage = appliance.get 'wattage'
			
			if timer.get('is_active') == 0
				total_timestamp = timer.get('total_timestamp') 
				if total_timestamp > 0
					formatted_time = formatTimestamp total_timestamp
					$('#'+timer.get('appliance_id')+'.time-display').html formatted_time
					running_cost = (total_timestamp / (60*60*1000)) * parseFloat(unit_rate) * (parseFloat(wattage) / 1000)
					$('#'+timer.get('appliance_id')+'.cost-display').html running_cost
	
		updateTimer = ->
			window.current_timestamp = (new Date).getTime()
			total_cost = parseFloat window.tariff.standing_charge
			#console.log "total_cost is "+window.tariff.standing_charge
			
			unit_rate = window.tariff.unit_rate
			for timer in timerCollection.models
				appliance_id = timer.get 'appliance_id'
				appliance = applianceCollection.get appliance_id
				wattage = appliance.get 'wattage'
				is_active = timer.get 'is_active'
				total_timestamp = timer.get('total_timestamp')
				
				if is_active == 1
					start_timestamp = timer.get 'start_timestamp'
					total_timestamp += current_timestamp - start_timestamp
					formatted_time = formatTimestamp total_timestamp
					$('#'+timer.get('appliance_id')+'.time-display').html formatted_time
				
				running_cost = (total_timestamp / (60*60*1000)) * parseFloat(unit_rate) * (parseFloat(wattage) / 1000)
				total_cost += running_cost
				#console.log "adding "+running_cost
				
				#if is_active == 1
				$('#'+timer.get('appliance_id')+'.cost-display').html running_cost
					
			$('#total_cost').html formatCurrency total_cost
			console.log total_cost
			
		$.timer(updateTimer, 200, true)
	
	initialiseTariffSelector = ->
		
		tariffSelector = new TariffSelectorModel()
		tariffSelector.fetch
			success : (model,response) ->
				tariffSelectorView = new TariffSelectorView
					model : tariffSelector
				$('#tariff_options_frame').html tariffSelectorView.render(window.user).el
				tariffSelectorView.updateTariffData()
	
	calculateSummary = ->
		timestamp = new Date().getTime()
		data = 
			user_id : window.user.get 'user_id'
			timestamp : timestamp
		$.get '/comparisons/generate', data, (response) ->
			#console.log $.parseJSON response
			comparisonCollection = new ComparisonCollection $.parseJSON response
			comparisonCollectionView = new ComparisonCollectionView
				collection : comparisonCollection
			#comparisonCollection.fetch()		
			#console.log comparisonCollection.toJSON()
			$('#comparisons').html comparisonCollectionView.render().el	

	$('document').ready ->
	
		$('#timer_view_link').on 'click' : (event) ->
			#$('#app_menu').children('li').eq(0).addClass 'active_page'
			#$('#app_menu').children('li').eq(1).removeClass 'active_page'
		
			if $('#timer_view_template').length == 0
				$.get "/views/fetch", { view : 'timer' }, (template) ->
					$('#app_templates').append template
					$('#page_container').append $(template).html()

					appliances = applianceCollection.models

					$('#timer_gallery').html timerCollectionView.render(appliances).el

					initialisePageCalculator()	
			else
				if current_page == "summary"
					summary_view = $('#summary_view').detach()
					$('#page_container').append timer_view
				
			current_page = "timer"	
			return false
	
		$('#summary_view_link').on 'click' : (event) ->
			#$('#app_menu').children('li').eq(1).addClass 'active_page'
			#$('#app_menu').children('li').eq(0).removeClass 'active_page'
			if $('#summary_view_template').length == 0
				$.get "/views/fetch", { view : 'summary' }, (template) ->
					$('#app_templates').append template
					timer_view = $('#timer_view').detach()
					$('#page_container').append $(template).html()
			else
				if current_page == "timer"
					timer_view = $('#timer_view').detach()
					$('#page_container').append summary_view
					
			calculateSummary()
			current_page = "summary"
			return false
		
		$('#info_frame_link').on 'click' : (event) ->
			$('#info_frame_container').css 'top', '0px'
			$('body').css "overflow", "hidden"
			$('#info_frame_container').animate
				opacity : 1
			, 200, 'easeOutSine'
			
	
	$.get "/views/fetch", { view : 'models' }, (templates) ->
						
		$('#app_templates').append templates		

		$('#app_container').append $('#info_frame_template').html()
		$('#info_frame_container').css 'top', '-1000px'
		
		initialiseApplianceModels()
		initialiseTimerModels()
		initialiseComparisonModels()
		initialiseTariffSelectorModel()
		initialiseUserModel()
		
		applianceCollection = new ApplianceCollection
		applianceCollectionView = new ApplianceCollectionView
			collection : applianceCollection

		timerCollection = new TimerCollection
		timerCollectionView = new TimerCollectionView
			collection : timerCollection
		
		window.user = new UserModel()
			
		if typeof($.cookie 'user_id') == 'undefined'
			$.get "/users/generateId", (response) ->
				user_id = $.parseJSON response
				cookie_data =
					expires : 1
				$.cookie 'user_id', user_id, cookie_data
				window.user = new UserModel
					user_id : user_id
				window.user.fetch
					success : (model,response) ->
						fetchModels()
						initialiseTariffSelector()
		else
			user_id = $.cookie 'user_id'
			#alert "welcome back "+user_id
			#window.user_id = user_id
			$.cookie('user_id').expires = 1
			window.user = new UserModel
				user_id : user_id
			window.user.fetch
				success : (model,response) ->
					fetchModels()
					initialiseTariffSelector()