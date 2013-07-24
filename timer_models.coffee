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
			'click' : 'timerToggle'
		timerToggle : ->
			is_active = this.model.get 'is_active'
			if is_active == 1
				timestamp = window.current_timestamp
				this.model.set 'start_timestamp', ''
			else
				timestamp = (new Date).getTime()
				this.model.set 'start_timestamp', timestamp
			
			appliance_id = this.model.get 'appliance_id' #
			
			data = 
				appliance_id : appliance_id
				is_active : this.model.get 'is_active'
				user_id : window.user_id
				timestamp : timestamp
			timer = this
			
			$.post '/timer/storeTimestamp', data, (response) ->
				response = JSON.parse response
				timer.model.set 'is_active', response.is_active
				timer.animate appliance_id, response.is_active

		animate : (appliance_id, is_active) ->
			if is_active == 0 #will become 1
				$(this.el).animate
					'background-color' : '#cccccc'
				,1000			
			else if is_active == 1 #will become 0
				$(this.el).animate
					'background-color' : '#333333'
				,1000
				
		render : (appliance, has_timer) ->

			this.template = this['template1']
			console.log this.model
			console.log appliance
			if has_timer 
				attributes = $.extend {}, this.model.toJSON()
			attributes = $.extend attributes, appliance.toJSON()
			this.$el.html this.template attributes
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

			return this
	
	window.TimerCollectionView = Backbone.View.extend
		tagName : 'ul'
				
		render : (appliances, timer_ids) ->

			for appliance in appliances
				appliance_id = appliance.get 'appliance_id'
				if $.inArray appliance_id, timer_ids
					this.renderTimer appliance, true
				else
					this.renderTimer appliance, false

			$(this.el).addClass 'thumbnails' 
			
			return this
			
		renderTimer : (appliance, has_timer) ->
			appliance_id = appliance.get 'appliance_id'
			timerModel = this.collection.get appliance_id
			if timerModel != undefined
				timerView = new TimerView
					model : timerModel
			else
				timerModel = new TimerModel
					appliance_id : appliance_id
					is_active : 0
					total_timestamp : 0
					start_timestamp : (new Date).getTime()
				timerView = new TimerView
					model : timerModel
					
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