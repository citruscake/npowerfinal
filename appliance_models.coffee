window.initialiseApplianceModels = ->
	window.ApplianceModel = Backbone.Model.extend
		idAttribute : 'appliance_id'

	window.ApplianceView = Backbone.View.extend
		tagName : 'li'
		template : _.template $('#app_button').html() #'<h3><%= name %>, <%= wattage %></h3>'
		render : ->

			$(this.el).addClass 'ui-state-default'
			$(this.el).addClass 'thumbnail'
			$(this.el).addClass 'draggable'
			$(this.el).attr('id', this.model.get('appliance_id'))
			$(this.el).css 'cursor','pointer'
			attributes = this.model.toJSON()
			this.$el.html this.template attributes
			return this
			
	window.ApplianceCollection = Backbone.Collection.extend
		model : ApplianceModel
		#url : SERVER_ROOT
		methodURL:
			'read' : '/appliances/fetch'
		sync : (method,model,options) ->
			if model.methodURL && model.methodURL[method.toLowerCase()]
				options.url = model.methodURL[method.toLowerCase()]
			Backbone.sync(method, model, options)
		
	window.ApplianceCollectionView = Backbone.View.extend
		tagName : 'ul'
		render : ->
			this.collection.forEach this.renderAppliance, this

			$(this.el).addClass 'connectedSortable'
			$(this.el).addClass 'thumbnails'

			$(this.el).disableSelection()
			return this
		renderAppliance : (appliance) ->
				applianceView = new ApplianceView
					model : appliance
				this.$el.append applianceView.render().el