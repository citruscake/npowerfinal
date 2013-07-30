(function() {
  window.initialiseComparisonModels = function(SERVER_ROOT, socket) {
    window.ComparisonModel = Backbone.Model.extend({
      idAttribute: 'comparison_id'
    });
    window.ComparisonView = Backbone.View.extend({
      tagName: 'li',
      template: _.template($('#comparison_frame').html()),
      render: function() {
        var attributes;
        attributes = this.model.toJSON();
        console.log(attributes);
        this.$el.html(this.template(attributes));
        return this;
      }
    });
    window.ComparisonCollection = Backbone.Collection.extend({
      model: ComparisonModel,
      url: SERVER_ROOT,
      methodURL: {
        'read': SERVER_ROOT + '/comparisons/fetch'
      },
      sync: function(method, model, options) {
        if (model.methodURL && model.methodURL[method.toLowerCase()]) {
          options.url = model.methodURL[method.toLowerCase()];
        }
        return Backbone.sync(method, model, options);
      }
    });
    return window.ComparisonCollectionView = Backbone.View.extend({
      tagName: 'ul',
      render: function() {
        if (this.collection.length !== 0) {
          this.collection.forEach(this.renderComparison, this);
        } else {
          this.$el.append("<li><h3>No cheaper tariffs found yet- you're a saving star!</h3></li>");
        }
        return this;
      },
      renderComparison: function(comparison) {
        var comparisonView;
        console.log(comparison);
        comparisonView = new ComparisonView({
          model: comparison
        });
        return this.$el.append(comparisonView.render().el);
      }
    });
  };

}).call(this);
