(function() {
  window.initialiseUserModel = function() {
    return window.UserModel = Backbone.Model.extend({
      idAttribute: 'user_id',
      urlRoot: '/users/fetch',
      methodURL: {
        'update': '/users/save'
      },
      sync: function(method, model, options) {
        if (model.methodURL && model.methodURL[method.toLowerCase()]) {
          options.url = model.methodURL[method.toLowerCase()];
        }
        return Backbone.sync(method, model, options);
      }
    });
  };

}).call(this);
