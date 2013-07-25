window.initialiseTariffSelectorModel = ->
	window.TariffSelectorModel = Backbone.Model.extend
		methodURL:
			'read' : '/tariff_selector_data/fetch'
		sync : (method,model,options) ->

			if model.methodURL && model.methodURL[method.toLowerCase()]
				options.url = model.methodURL[method.toLowerCase()]
			Backbone.sync(method, model, options)
			
	window.TariffSelectorView = Backbone.View.extend
		tagName : 'div'
		template : _.template $('#tariff_selector').html()
		events : 
	#		'click' : 'timerToggle'
			'change #region_select' : 'updateRegion'
			'change #provider_select' : 'updateProvider'
			'change #tariff_select' : 'updateTariff'
			
		updateRegion : (event) ->
			region_id = parseInt event.target.value
			tariffs = _.filter this.model.get('tariff_data'), (tariff) ->
				return tariff.region_id == region_id
			provider_ids = _.uniq _.map tariffs, (tariff) ->
				return tariff.provider_id
			regional_providers = _.sortBy _.filter(this.model.get('provider_data'), (provider) ->
				if $.inArray(provider.provider_id, provider_ids) == -1
					return false
				else
					return true
			), (provider) ->
				return provider.title
			provider_id = _.first _.map regional_providers, (provider) ->
				return provider.provider_id
			provided_tariffs = _.sortBy (_.filter tariffs, (tariff) ->
				return tariff.provider_id == provider_id
			), (tariff) ->
				return tariff.tariff_label
			tariff_id = _.first _.map provided_tariffs, (tariff) ->
				return tariff.tariff_id
			
			window.user.set
				region_id : region_id
				provider_id : provider_id
				tariff_id : tariff_id
			window.user.save()
			$('#tariff_options_frame').html this.render(window.user).el
			this.delegateEvents()
			this.updateTariffData()
			
		updateProvider : (event) ->
			provider_id = parseInt event.target.value
			region_id = window.user.get 'region_id'
			tariffs = _.filter this.model.get('tariff_data'), (tariff) ->
				return (tariff.provider_id == provider_id) && (tariff.region_id == region_id)
			tariff_ids = _.map (_.sortBy tariffs, (tariff) ->
				return tariff.tariff_label
			), (tariff) ->
				return tariff.tariff_id
			tariff_id = _.first tariff_ids
			
			console.log event.target.value
			console.log region_id+" "+provider_id+" "+tariff_id
			
			window.user.set
				provider_id : provider_id
				tariff_id : tariff_id
			window.user.save()
			$('#tariff_options_frame').html this.render(window.user).el
			this.delegateEvents()
			this.updateTariffData()
			
		updateTariff : (event) ->
			tariff_id = parseInt event.target.value
			window.user.set
				tariff_id : tariff_id
			window.user.save()
			console.log "saved "+window.user.get('region_id')+","+window.user.get('provider_id')+","+window.user.get('tariff_id')
			this.updateTariffData()
			
		updateTariffData : ->
			tariff_data = this.model.get 'tariff_data'
			tariff_id = window.user.get 'tariff_id'
			#console.log "THE tariff_id "+tariff_id
			window.tariff = _.first _.filter tariff_data, (tariff) ->
				#console.log tariff.tariff_id
				return tariff.tariff_id == tariff_id
			$('#total_cost').html '&#163;'+window.tariff.unit_rate
	
		render : (user_data) ->
			this.template = this['template']
			attributes =
				user_data : user_data.toJSON()
				tariff_selector_data : this.model.toJSON()
			this.$el.html this.template attributes
			return this