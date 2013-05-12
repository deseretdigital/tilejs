define(['jQuery', 'Underscore', 'Backbone', 'Dash'], 
  function($, _, Backbone, Dash) {
    
  // ------------------------------------------------------------------------
  //    TILE : Lister
  // ------------------------------------------------------------------------
  
  return Dash.Tile.extend({

    className: 'tile lister',
    
    initialize: function() {
      this.bind('tiles');
    }
    
    /*
    render: function() {
      if (this.mark && !this.marked && !this.isSized()) {
        return this;
      }     
      return ((this.width == 'auto' || this.height == 'auto') 
        ? this.renderFluid() : this.renderFixed());
    }
    */
    
  });

});