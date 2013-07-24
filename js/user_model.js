(function() {
  window.initialiseUserModel = function() {
    return window.UserModel = Backbone.Model.extend({
      idAttribute: 'user_id',
      urlRoot: '/users/fetch'
    });
  };

}).call(this);
