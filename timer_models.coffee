window.initialiseTimerModels = ->
	window.TimerModel = Backbone.Model.extend
		idAttribute : 'appliance_id'
		#url : SERVER_ROOT
		methodURL:
			'update' : '/timer/update/display'
		sync : (method,model,options) ->
			if model.methodURL && model.methodURL[method.toLowerCase()]
				options.url = model.methodURL[method.toLowerCase()]
			Backbone.sync(method, model, options)
			
	window.TimerView = Backbone.View.extend
		tagName : 'li'
		template1 : _.template $('#app_timer').html()
		events : 
			'click .button' : 'timerToggle'
		timerToggle : ->
			is_active = this.model.get 'is_active'
			if is_active == 1
				timestamp = window.current_timestamp
				start_timestamp = this.model.get 'start_timestamp'
				total_timestamp = this.model.get 'total_timestamp'
				total_timestamp += timestamp - start_timestamp
				this.model.set 'total_timestamp', total_timestamp
				this.model.set 'start_timestamp', ''
			else
				timestamp = (new Date).getTime()
				this.model.set 'start_timestamp', timestamp
			
			appliance_id = this.model.get 'appliance_id' #
			
			this.animatePress appliance_id, is_active, 200
			
			data = 
				appliance_id : appliance_id
				is_active : this.model.get 'is_active'
				user_id : window.user.get 'user_id'
				timestamp : timestamp
			timer = this
			
			$.post '/timer/storeTimestamp', data, (response) ->
				response = JSON.parse response
				console.log "IS_ACTIVE "+response.is_active
				timer.model.set 'is_active', response.is_active
				timer.animateColor appliance_id, response.is_active, 200

		animatePress : (appliance_id, is_active, timeframe) ->
			button = $('#'+appliance_id+'.button')
			if is_active == 1
				button.animate
					#'box-shadow' : '0px 15px 0px #888888'
					#'boxShadow' : '0px 6px 0px #888888'
					'top' : '-5px'
					#boxShadow: '0 0 30px #44f'
				,timeframe
			else if is_active == 0
				button.animate
					#'box-shadow' : '0px 2px 0px #777777'
					#'boxShadow' : '0px 3px 0px #777777'
					'top' : '-3px'
					#boxShadow: '0 0 30px #44f'
				,timeframe
				
		animateColor : (appliance_id, is_active, timeframe) ->
			button = $('#'+appliance_id+'.button')
			name = $('#'+appliance_id+'.name')
			console.log button
			if is_active == 0
				button.animate
					'background-color' : '#666666'
				,0
				name.delay(200).animate
					'color' : '#333333'
				,0
			else if is_active == 1
				button.animate
					'background-color' : 'rgb(34, 220, 255)'
				,timeframe
				name.delay(200).animate
					'color' : '#eeeeee'
				,0
				
		render : (appliance) ->

			this.template = this['template1']
			#console.log this.model
			#console.log appliance
			#if has_timer 
			#	attributes = $.extend {}, this.model.toJSON()
			#attributes = $.extend attributes, appliance.toJSON()
			attributes = $.extend this.model.toJSON(), appliance.toJSON()
			this.$el.html this.template attributes
			console.log "attributes..."
			console.log attributes
			$(this.el).addClass 'thumbnail'
			#$(this.el).addClass 'ui-state-default'
			$(this.el).attr 'id', appliance.get 'appliance_id'
			$(this.el).find('.timer-display').attr 'id', appliance.get 'appliance_id'
			#$(this.el).css 'opacity', 0

			#$(this.el).css 'list-style-type', 'none'
			
			#if this.model.get('is_active') == 0
			#	$(this.el).css 'background-color', '#cccccc'
			#else 
			#	$(this.el).css 'background-color', '#333333'
			appliance_id = appliance.get 'appliance_id'
			is_active = this.model.get 'is_active'
			
			if is_active == 0
				$(this.el).find('#'+appliance_id+'.button').css 'background-color', '#666666'
			else
				$(this.el).find('#'+appliance_id+'.button').css 'background-color', 'rgb(34, 220, 255)'
				$(this.el).find('#'+appliance_id+'.button').css 'top', '-3px'
				$(this.el).find('#'+appliance_id+'.name').css 'color', '#eeeeee'
			return this
	
	window.TimerCollectionView = Backbone.View.extend
		tagName : 'ul'
				
		render : (appliances) ->

			for appliance in appliances
			#_.each appliances, (appliance) ->
				this.renderTimer appliance
				
				#appliance_id = appliance.get 'appliance_id'
				#if $.inArray(appliance_id, timer_ids) == -1
				#	this.renderTimer appliance, false
				#else
				#	this.renderTimer appliance, false

			$(this.el).addClass 'thumbnails' 
			
			return this
			
		renderTimer : (appliance) ->
			appliance_id = appliance.get 'appliance_id'
			timerModel = this.collection.get appliance_id
			#if timerModel != undefined
			timerView = new TimerView
				model : timerModel
			#else
			#	timerModel = new TimerModel
			#		appliance_id : appliance_id
			#		is_active : 0
			#		total_timestamp : 0
			#		start_timestamp : ""
			#	timerView = new TimerView
			#		model : timerModel
			
			this.$el.append timerView.render(appliance).el

	window.TimerCollection = Backbone.Collection.extend 
		model : TimerModel
		#url : SERVER_ROOT
		methodURL:
			'read' : '/timers/fetch'
		sync : (method,model,options) ->

			if model.methodURL && model.methodURL[method.toLowerCase()]
				options.url = model.methodURL[method.toLowerCase()]
			Backbone.sync(method, model, options)
		addDummyTimers : (appliances) ->
			for appliance in appliances
				appliance_id = appliance.get 'appliance_id'
				timerModel = this.get appliance_id
				if timerModel == undefined
					timerModel = new TimerModel
						appliance_id : appliance_id
						is_active : 0
						total_timestamp : 0
						start_timestamp : ""
					this.add timerModel
			
