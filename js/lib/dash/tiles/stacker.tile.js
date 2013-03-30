define(['jQuery', 'Underscore', 'Backbone', 'Dash'], 
  function($, _, Backbone, Dash) {
    
  // ------------------------------------------------------------------------
  //    TILE : Stacker - anchored headers & footers, with variable size body
  // ------------------------------------------------------------------------
  
  return Dash.Tile.extend({
    
    className: 'tile stacker',
    
    initialize: function() {
      this.bind('tiles');
    },
    
    childInit: function(tile) {
      this.bindChild(tile, {
        name: ''
      });
    },
    
    /**
     * Render - Determine if fluid or fixed layout mode
     */
    render: function() {
      if (this.mark && !this.marked && !this.isSized()) {
        return this;
      }     
      return ((this.width == 'auto' || this.height == 'auto') 
        ? this.renderFluid() : this.renderFixed());
    },
    
    /**
     * Render with fluid width & height
     */
    renderFluid: function() {
      var i, l, tile;
      
      for (i = 0, l = this.tiles.length; i < l; i++) {
        tile = this.tiles[i];
        
        tile.$el.css({
          position: 'static',
          top: '',
          bottom: '',
          left: '',
          right: ''
        });
        
        tile.render();
      }
      
      return this;
    },
    
    /**
     * Render with fixed width & height
     */
    renderFixed: function() {
      var top = 0, offset = 0, body, height, i, l, tile, pad
        , width = this.getWidth();
      
      for (i = 0, l = this.tiles.length; i < l; i++) {
        tile = this.tiles[i];
        pad = this.getPad(tile);
        
        if (tile.name == 'body' && !body) {
          body = tile; 
          top = offset; 
          offset = 0;
        } 
        else {
          tile._change('width', width - pad.width);
          this.renderFixedTile(tile, body 
            ? { top: '', bottom: offset } 
            : { top: offset, bottom: '' }
          );
          height = this.getHeight(tile, true); 
          offset += height;
          tile._change('height', height - pad.height);
        }
      }
      if (body) {
        pad = this.getPad(body);
        this.renderFixedTile(body, {
          top: top,
          bottom: offset
        });
        body._change('width', this.getWidth() - pad.width);
        body._change('height', this.getHeight() - top - offset - pad.height);
      }
      
      return this;
    },
    
    /**
     * Render the tile
     */
    renderFixedTile: function(tile, css) {
      
      tile.$el.css({
        position: 'absolute',
        top: css.top,
        bottom: css.bottom,
        left: 0,
        right: 0
      });
      
      tile.render();
    }
    
  });

});