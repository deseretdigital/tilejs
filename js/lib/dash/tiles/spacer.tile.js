define(['jQuery', 'Underscore', 'Backbone', 'Dash'], 
  function($, _, Backbone, Dash) {
    
  // ------------------------------------------------------------------------
  //    TILE : SPACER - equal sized blocks without edges
  // ------------------------------------------------------------------------
  
  var floor = Math.floor;
  
  return Dash.Tile.extend({
    
    className: 'tile blocks',
    
    // Initialize
    initialize: function() {
      this.bind('tiles');
      this.bindThis({
        axis: {
          inherit: 0,
          horizontal: 1,
          vertical: 2
        }
      });
    },
    
    // Convert Axis to values
    axisTo: function(w, h) {
      return (this.axis || this.superFn('axisTo', 1, 2, 1)) == 1 ? w : h;
    },
    
    // Render
    render: function() {
      var horiz = this.axisTo(true, false)
        , width = this.getWidth()
        , height = this.getHeight()
        , total = horiz ? width : height
        , avg = this.tiles.length ? floor(total / this.tiles.length) : total;
      
      for (var i = 0, l = this.tiles.length; i < l; i++) {
        var tile = this.tiles[i];
        var size = (i == (l - 1)) ? total : avg; 
        
        this.renderTile(tile, {
          width: (horiz ? size : width) - this.getPad(tile).width,
          height: (horiz ? height : size) - this.getPad(tile).height,
          display: horiz ? 'inline-block' : 'block'
        });
        total -= avg;
      }
      return this;
    }
  });
  
});