$ ->

	timeline_view = null
	realtime_view = null
	applianceCollection = null 
	applianceCollectionView = null
	timerCollection = null
	timerCollectionView = null
	comparisonCollection = null
	comparisonCollectionView = null	
	userModel = null
		
	#window.user_id = '2a550081-364e-4aa5-b438-4b21f60c158e'
			
	fetchModels = ->

		applianceCollection.fetch
			success : (collection,response) ->
				timerCollection.fetch
					data :
						user_id : window.user_id
					success : (collection,response) ->
						$('#realtime_view_link').trigger 'click'
					error : (h,response) ->	
			error : (h,response) ->
	
	fetchTariffs = ->
		
		$.get "/tariff_selector_data/fetch", (response) ->
			tariff_selector_data = $.parseJSON response
			template_data =
				user_data : userModel.toJSON()[0]
				tariff_selector_data : tariff_selector_data
			console.log template_data
			$('#tariff_options_frame').html _.template template_data
				
	initCalculator = ->

		for timer in timerCollection.models
			if timer.get('is_active') == 0
				total_timestamp = timer.get('total_timestamp') 
				formatted_time = formatTimestamp total_timestamp
				$('#'+timer.get('appliance_id')+'.timer-display').html(formatted_time)
	
		updateTimer = ->
			window.current_timestamp = (new Date).getTime()
			for timer in timerCollection.models
				if timer.get('is_active') == 1
					start_timestamp = timer.get 'start_timestamp'
					total_timestamp = timer.get('total_timestamp') + current_timestamp - start_timestamp
					formatted_time = formatTimestamp total_timestamp
					$('#'+timer.get('appliance_id')+'.timer-display').html(formatted_time)

					
		$.timer(updateTimer, 200, true)
		
	formatTimestamp = (timestamp) ->
		time = new Date timestamp
		formatted_hours = String time.getHours()
		formatted_minutes = String time.getMinutes()
		formatted_seconds = String time.getSeconds()
		formatted_milliseconds = String time.getMilliseconds()		
		
		if (formatted_hours.length) < 2
			formatted_hours = "0" + formatted_hours
		if (formatted_minutes.length) < 2
			formatted_minutes = "0" + formatted_minutes
		if (formatted_seconds.length) < 2
			formatted_seconds = "0" + formatted_seconds
		if (formatted_milliseconds.length) < 2
			formatted_milliseconds = "00" + formatted_milliseconds
		else if (formatted_milliseconds.length) < 3
			formatted_milliseconds = "0" + formatted_milliseconds
		formatted_time = formatted_hours + ":" + formatted_minutes + ":" + formatted_seconds + ":" + formatted_milliseconds
	
	calculateSummary = ->
		timestamp = new Date().getTime()
		data = 
			user_id : window.user_id
			timestamp : timestamp
		$.get '/comparisons/generate', data, (response) ->
			#console.log $.parseJSON response
			comparisonCollection = new ComparisonCollection $.parseJSON response
			comparisonCollectionView = new ComparisonCollectionView
				collection : comparisonCollection
			#comparisonCollection.fetch()		
			console.log comparisonCollection.toJSON()
			$('#savings').html comparisonCollectionView.render().el	

	$('document').ready ->
	
		$('#realtime_view_link').on 'click' : (event) ->
			$('#app_menu').children('li').eq(0).addClass 'active_page'
			$('#app_menu').children('li').eq(1).removeClass 'active_page'
		
			if $('#realtime_view_template').length == 0
				$.get "/views/fetch", { view : 'realtime' }, (template) ->
					$('#app_templates').append template
					$('#page_container').append $(template).html()
					#$('#appliance_list').html applianceCollectionView.render().el
					
					timer_ids = []
					appliances = applianceCollection.models
					for appliance in appliances

						appliance_id = appliance.get 'appliance_id'
						timer = timerCollection.get appliance_id
						if timer
							console.log timer
							is_displayed = timer.get 'is_displayed'
		
							#if is_displayed == 1
							timer_ids.push appliance

					timer_el = timerCollectionView.render(appliances, timer_ids).el
					$('#timer_gallery').html timer_el
									
					initCalculator()
					
					animate_ids = []

					$(timer_el).children('li').animate
						opacity : 1
					,300
					return false
					
			else
				timeline_view = $('#timeline_view').detach()
				$('#page_container').append realtime_view
				return false
	
		$('#timeline_view_link').on 'click' : (event) ->
			$('#app_menu').children('li').eq(1).addClass 'active_page'
			$('#app_menu').children('li').eq(0).removeClass 'active_page'
			if $('#timeline_view_template').length == 0
				$.get "/views/fetch", { view : 'timeline' }, (template) ->
					$('#app_templates').append template
					realtime_view = $('#realtime_view').detach()
					$('#page_container').append $(template).html()
			else
				realtime_view = $('#realtime_view').detach()
				$('#page_container').append timeline_view
			calculateSummary()
			return false
	
	$.get "/views/fetch", { view : 'models' }, (templates) ->
						
		$('#app_templates').append templates				
								
		initialiseApplianceModels()
		initialiseTimerModels()
		initialiseComparisonModels()
		initialiseUserModel()
		
		applianceCollection = new ApplianceCollection
		applianceCollectionView = new ApplianceCollectionView
			collection : applianceCollection

		timerCollection = new TimerCollection
		timerCollectionView = new TimerCollectionView
			collection : timerCollection
		
		userModel = new UserModel()
		
		if typeof($.cookie 'user_id') != 'undefined'
			$.get "/users/generateId", (response) ->
				user_id = $.parseJSON response
				$.cookie 'user_id', user_id, 
					expires : 1
					path : '/'	
				userModel = new UserModel
					user_id : user_id
				userModel.fetch
					success : (model,response) ->
						fetchModels()
						fetchTariffs()
				
		else
			user_id = $.cookie 'user_id'
			#window.user_id = user_id
			$.cookie('user_id').expires = 1
			userModel = new UserModel
				user_id : user_id
			userModel.fetch
				success : (model,response) ->
					fetchModels()
					fetchTariffs()
	