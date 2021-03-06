window.initialiseComparisonModels = (SERVER_ROOT, socket) ->
	window.ComparisonModel = Backbone.Model.extend
		idAttribute : 'comparison_id'
			
	window.ComparisonView = Backbone.View.extend
		tagName : 'li'
		template : _.template $('#comparison_frame').html()
		render : ->
			attributes = this.model.toJSON()

			this.$el.html this.template attributes
			return this
			
	window.ComparisonCollection = Backbone.Collection.extend
		model : ComparisonModel
		url : SERVER_ROOT
		methodURL:
			'read' : SERVER_ROOT + '/comparisons/fetch'
		sync : (method,model,options) ->
			if model.methodURL && model.methodURL[method.toLowerCase()]
				options.url = model.methodURL[method.toLowerCase()]
			Backbone.sync(method, model, options)
	
	window.ComparisonCollectionView = Backbone.View.extend
		tagName : 'ul'
		render : ->
			if this.collection.length != 0
				this.collection.forEach this.renderComparison, this
			else
				this.$el.append "<li><h3 style=\"padding:20px 20px 20px 20px;\">No cheaper tariffs found yet - you're doing great!</h3></li>"
				
			return this
		renderComparison : (comparison) ->

			comparisonView = new ComparisonView
				model : comparison
			this.$el.append comparisonView.render().el