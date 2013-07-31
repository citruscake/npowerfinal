$ ->

	summary_view = null
	timer_view = null
	window.tariffSelector = null
	applianceCollection = null 
	applianceCollectionView = null
	timerCollection = null
	timerCollectionView = null
	comparisonCollection = null
	comparisonCollectionView = null	
	window.user = null
	window.tariff = null
	current_page = null
	
	$('#app_container').data('complete', false)
	$('#app_container').data('disable', false)
	$('#timer_view_link').data("loading") 
	
	in_use = $.cookie 'in_use'
	if in_use == 'true'
		window.location.href = "/already_open"
	else
		$.cookie 'in_use', 'true', 
			expires : 7
	
	window.onbeforeunload = ->
		$.removeCookie 'in_use'
		return null

	fetchModels = () ->

		applianceCollection.fetch
			success : (collection,response) ->
				console.log applianceCollection.models
				timerCollection.fetch
					data :
						user_id : window.user.get 'user_id'
					success : (collection,response) ->
						$('#app_container').append "<div id=\"info_frame_container\"></div>"
						$('#info_frame_container').html _.template $('#info_frame_template').html()
						$('#info_frame_container').css 'top', '-1000px'
						timerCollection.addDummyTimers applianceCollection.models
						$('#timer_view_link').trigger 'click'
						current_page = "timer"
						if window.existing_user == false
							$('#info_frame_link').trigger 'click'
							$('#welcome_frame').html "Welcome new user"
						else
							$('#welcome_frame').html "Welcome back!"
						console.log window.user
						initialiseInfoFrameCloseFunctionality()
						$('#timer_view_link').removeData("loading")
					error : (h,response) ->	
			error : (h,response) ->
			
	initialiseInfoFrameCloseFunctionality = ->		
			
		$('#info_frame_container').on 'click', '#info_frame_close_link,#go_link_frame', (event) ->
			$('#info_frame_container').css 'top', '-1000px'
			if (window.existing_user == false) 
				window.existing_user = true
				$('#info_frame_container').html _.template $('#info_frame_template').html()
			$('#info_frame_container').animate
				opacity : 0
			, 200, 'easeOutSine'
			, ->
				$('body').css "overflow", "visible"
			
		#return false
	
	initialisePageCalculator = ->

		if (window.tariff != undefined)
			unit_rate = window.tariff.unit_rate
	
			for timer in timerCollection.models
				appliance_id = timer.get 'appliance_id'
				appliance = applianceCollection.get appliance_id
				wattage = appliance.get 'wattage'
			
				if timer.get('is_active') == 0
					total_timestamp = timer.get('total_timestamp') 
					if total_timestamp > 0
						
						$('#'+timer.get('appliance_id')+'.time-display').html formatTimestamp total_timestamp
						running_cost = (total_timestamp / (60*60*1000)) * parseFloat(unit_rate) * (parseFloat(wattage) / 1000)

						currency_string = formatCurrency running_cost, 4
						pence_fraction = currency_string.slice -2
						currency_string = currency_string.substr(0, currency_string.length-2)
						$('#'+timer.get('appliance_id')+'.cost-display').html currency_string+"<span class=\"pence-fraction\">."+pence_fraction+"</span>"
	
			updateCalculatorTimer = ->
			
				window.current_timestamp = (new Date).getTime()

				total_cost = parseFloat window.tariff.standing_charge
				total_time = parseFloat(window.current_timestamp) - parseFloat(window.user.get 'start_timestamp')
			
			#	alert "start timestamp is "+window.user.get 'start_timestamp'
			
				end_timestamp = parseFloat(window.user.get('start_timestamp')) + (24*60*60*1000)
				
				#alert total_time
				
				#html = total_time_date.getHours()+":"+total_time_date.getMinutes()+":"+total_time_date.getSeconds()+"</br></br>"
				total_time_date = new Date(86400000-total_time)
				#total_time_date = new Date(total_time)
				
				hours = total_time_date.getHours()
				minutes = total_time_date.getMinutes()
				seconds = total_time_date.getSeconds()
				
			#	total_time_html = "<div class=\"span6\"><span class=\"total_label\">Time left:</span><span class=\"total_time\">"+hours+"h "+minutes+"m "+seconds+"s"+"</span></div>"
				
				$('#total_time').html hours+"h "+minutes+"m "+seconds+"s"
				#$('#total_time').html hours+"h "+minutes+"m "+seconds+"s left"
				
				#days = (total_time) / (60*60*1000*24)
				
				if (86400000-total_time) <= 0 && $('#app_container').data('complete') == false
					$('#info_frame_container').html $('#info_frame_end_template').html()
					$('#info_frame_link').trigger 'click'
					$('.turn-off').trigger 'click'
					$('#app_container').data 'complete', true
				
					$.removeCookie 'user_id'
				
				console.log minutes
			
				unit_rate = window.tariff.unit_rate
				for timer in timerCollection.models
					appliance_id = timer.get 'appliance_id'
					appliance = applianceCollection.get appliance_id
					wattage = appliance.get 'wattage'
					is_active = timer.get 'is_active'
					total_timestamp = timer.get('total_timestamp')
				
					start_timestamp = timer.get 'start_timestamp'
					if is_active == 1
						total_timestamp += current_timestamp - start_timestamp
						console.log "total_timestamp "+total_timestamp
						$('#'+timer.get('appliance_id')+'.time-display').html formatTimestamp total_timestamp
				
					running_cost = (total_timestamp / (60*60*1000)) * parseFloat(unit_rate) * (parseFloat(wattage) / 1000)
					total_cost += running_cost

					if parseFloat(total_timestamp) > 0 || parseFloat(start_timestamp) > 0
						currency_string = formatCurrency running_cost, 4
						pence_fraction = currency_string.slice -2
						currency_string = currency_string.substr(0, currency_string.length-2)
						$('#'+timer.get('appliance_id')+'.cost-display').html currency_string+"<span class=\"pence-fraction\">."+pence_fraction+"</span>"
					
			#	total_cost_html = "<div class=\"span6\"><span class=\"total_label\">Total spend : </span><span class=\"total_cost\">"+formatCurrency(total_cost)+"</span></div>"
				$('#total_cost').html formatCurrency(total_cost)
			
			calculatorTimer = $.timer(updateCalculatorTimer, 200, true)
	
	initialiseTariffSelector = ->
		
		window.tariffSelector = new TariffSelectorModel()
		window.tariffSelector.fetch
			success : (model,response) ->
				tariffSelectorView = new TariffSelectorView
					model : window.tariffSelector
				$('#tariff_options_frame').html tariffSelectorView.render(window.user).el
				tariffSelectorView.updateTariffData()
	
	calculateSummary = ->
		timestamp = new Date().getTime()
		data = 
			user_id : window.user.get 'user_id'
			timestamp : timestamp
		$.get '/comparisons/generate', data, (response, callback) ->

			comparisonCollection = new ComparisonCollection $.parseJSON response
			comparisonCollectionView = new ComparisonCollectionView
				collection : comparisonCollection

			$('#summary_view_link').data("comparison_data", comparisonCollectionView.render().el)
			$('#summary_view_link').data("ready", true)


	$('document').ready ->
	
		$('#reset_app_link').on 'click' : (event) ->
			choice = confirm 'Would you like to start again?'
			if choice == true
				user_id = window.user.get 'user_id'
				$.post '/users/delete', {user_id : user_id}, (response) ->
					$.removeCookie 'user_id'
					window.location.href = '/'
	
		$('#brand_frame').on 'click' : (event) ->
			window.location.href = "/"
	
		$('#timer_view_link').on 'click' : (event) ->

			if $('#timer_view_link').data("loading") || $('#summary_view_link').data("loading")
				return false
			else
				$('#timer_view_link').data("loading", true)
				if $('#timer_view_template').length == 0
					$.get "/views/fetch", { view : 'timer' }, (template) ->
						$('#app_templates').append template
						$('#page_container').html $(template).html()

						appliances = applianceCollection.models
	
						$('#timer_gallery').html timerCollectionView.render(appliances).el

						initialisePageCalculator()
						setTimeout ->
							$('#timer_view_link').removeData("loading")
						, 400
				else
					if current_page == "summary"
						summary_view = $('#summary_view').detach()
						$('#page_container').html timer_view
					setTimeout ->
						$('#timer_view_link').removeData("loading")
					, 400
					
				current_page = "timer"
				return false
	
		$('#summary_view_link').on 'click' : (event) ->
		
			if $('#summary_view_link').data("loading") || $('#timer_view_link').data("loading")
				return false
			else
				if $('#summary_view_template').length == 0
					$.get "/views/fetch", { view : 'summary' }, (template) ->
						$('#app_templates').append template
						updateSummaryTimer = ->
							console.log $('#summary_view_link').data("ready")
							if $('#summary_view_link').data("ready") != undefined
								current_page = "summary"
								timer_view = $('#timer_view').detach()
								$('#page_container').html $(template).html()
								$('#comparisons').html $('#summary_view_link').data('comparison_data')
								$('#summary_view_link').removeData("ready")
								setTimeout ->
									$('#summary_view_link').removeData("loading")
								, 400
								$('#summary_view_link').removeData("comparison_data")
								summaryTimer.stop()
									
						summaryTimer = $.timer(updateSummaryTimer, 200, true)
						calculateSummary()
				else
					if current_page == "timer"
						updateSummaryTimer = ->
							if $('#summary_view_link').data("ready") != undefined
								current_page = "summary"
								timer_view = $('#timer_view').detach()
								$('#page_container').html summary_view
								$('#comparisons').html $('#summary_view_link').data('comparison_data')
								setTimeout ->
									$('#summary_view_link').removeData("loading")
								, 400
								$('#summary_view_link').removeData("ready")
								$('#summary_view_link').removeData("comparison_data")
								summaryTimer.stop()
								
						summaryTimer = $.timer(updateSummaryTimer, 200, true)
						calculateSummary()
		
						$('#page_container').append summary_view
					else
						$('#summary_view_link').removeData("loading")
					
				return false
		
		$('#info_frame_link').on 'click' : (event) ->
							
			$('#info_frame_container').css 'top', '0px'
			$('body').css "overflow", "hidden"
			$('#info_frame_container').animate
				opacity : 1
			, 200, 'easeOutSine'
			
	
	$.get "/views/fetch", { view : 'models' }, (templates) ->
						
		$('#app_templates').append templates		
		
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
			window.existing_user = false
			start_timestamp = new Date().getTime()
			$.post "/users/create", {start_timestamp : start_timestamp}, (response) ->
				user_id = $.parseJSON response
				cookie_data =
					expires : 3
				$.cookie 'user_id', user_id, cookie_data
				window.user = new UserModel
					user_id : user_id
				window.user.fetch
					success : (model,response) ->
						initialiseTariffSelector()
						fetchModels()
		else
			user_id = $.cookie 'user_id'
			window.existing_user = true
			$.cookie('user_id').expires = 1
			window.user = new UserModel
				user_id : user_id
			window.user.fetch
				success : (model,response) ->
					initialiseTariffSelector()
					fetchModels(true)