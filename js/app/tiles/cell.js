define(['jQuery', 'Underscore', 'Backbone', 'Dash'], 
  function($, _, Backbone, Dash) {
    
  // ------------------------------------------------------------------------
  //    CELL
  // ------------------------------------------------------------------------
  
  return Backbone.View.extend({
    
    className: 'cell',
    
    render: function() {
      this.$el.html('<h1>' + this.label + '</h1>');
      return this;
    }
  });
  
});