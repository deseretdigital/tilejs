define(['jQuery', 'Underscore', 'Backbone', 'Dash'], 
  function($, _, Backbone, Dash) {
    
  // ------------------------------------------------------------------------
  //    TILE : NAVBAR
  // ------------------------------------------------------------------------
  
  return Dash.Tile.extend({
    
    className: 'tile navbar',
    
    initialize: function() {
      this.bind('label', {
        filter: 'Placeholder text'
      });
    },
    
    render: function() {
      this.$el.html('<h1>' + this.label + '</h1>');
      return this;
    }
  });
  
});