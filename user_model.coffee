window.initialiseUserModel = ->
	window.UserModel = Backbone.Model.extend
		idAttribute : 'user_id'
		urlRoot : '/users/fetch'