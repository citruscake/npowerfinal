window.initialiseUserModel = ->
	window.UserModel = Backbone.Model.extend
		idAttribute : 'user_id'
		urlRoot : '/users/fetch'
		methodURL:
			'update' : '/users/save'
		sync : (method,model,options) ->

			if model.methodURL && model.methodURL[method.toLowerCase()]
				options.url = model.methodURL[method.toLowerCase()]
			Backbone.sync(method, model, options)