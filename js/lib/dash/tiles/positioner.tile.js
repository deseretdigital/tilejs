define(['jQuery', 'Underscore', 'Backbone', 'Dash'], 
  function($, _, Backbone, Dash) {
    
  // ------------------------------------------------------------------------
  //    TILE : Positioner
  // ------------------------------------------------------------------------
  
  var round	= Math.round;
  
  return Dash.Tile.extend({
    
    className: 'tile positioner',
    
    modes: null,  
    
    initialize: function() {
      Dash.Tile.prototype.initialize.apply(this, arguments);
      this.modes = [
        this.screenMode,
        this.offsetMode,
        this.centerMode,
        this.targetMode,
        this.dockMode
      ];
    },
    
    // Initialize the children
    childInit: function(tile) {
      this.bindChild(tile, {
        position: {
          offset: 1,
          screen: 0,
          center: 2,
          target: 3,
          dock: 4
        },
        anchor: { tl: 0, tr: 1, bl: 2, br: 3 },
        axis: { vertical: 0, horizontal: 1 },
        sizing: { fixed: 0, flow: 1 },
        target: null,        
        zindex: 0,
        width: undefined,
        height: undefined,
        overflow: [ 'auto', 'hidden' ],
        x: 0,
        y: 0
      });
    },
    
    /**
     * Bubble changes up the tree to find root changes
     */
    bubble: function(tile, child) {
      var change;
      
      if (child) {
        if (child.mark) { 
this.seeChange(tile, '-DROP-MARKED');          
          return;
        }
        if (this.isSized()) {
this.seeChange(tile, '-DROP-SIZED');
          return;
        }
        if (this.isFluid(child)) {
this.seeChange(tile, '-BUBBLE-MARK');  
          this.markChange(child);
          tile = this;
        }
      } else {
this.seeChange(tile, '-BUBBLE');        
      }
      this._bubble(tile);
    },
    
    // Determine if the child is using a fluid layout
    isFluid: function(tile) {
      return (tile.position && (!tile.width || !tile.height));
    },
    
    /**
     * Test to see if render involves reflow
     */
    isReflow: function() {
      return (this.isSized() || !this.marked && !this.change);
    },

    // Render children
    render: function() {
      var tiles = this.isReflow() ? this.tiles : this.marked;

//this.seeTiles(this.cid + " POSITIONER RENDER", tiles);

      if (_.isArray(tiles)) {
        for (var i = 0, l = tiles.length; i < l; i++) {
          var tile = tiles[i];
          this.modes[tile.position].call(this, tile);
        }
      }
      return this;
    },
    
    /**
     * Set the CSS on a tile & trigger a render
     */
    renderTile: function(tile, css) {
      var fluid = this.isFluid(tile);
      
      tile._change('width', css.width);
      tile._change('height', css.height);
      
      fluid && tile.render();
      tile.$el.css(css);
      fluid || tile.render();
    },
        
    // ----------------------------------------------------------------------
    //    SCREEN MODE - cover the entire area of the positioner
    // ----------------------------------------------------------------------
    
    screenMode: function(tile) {
      var pad = this.getPad(tile);
      this.renderTile(tile, {
        position: 'absolute',
        width: this.getWidth() - pad.width,
        height: this.getHeight() - pad.height,
        top: '',
        left: '',
        right: '',
        bottom: ''
      });
    },
    
    // ----------------------------------------------------------------------
    //    CENTER MODE - center relative to the positioner
    // ----------------------------------------------------------------------
    
    centerMode: function(tile) {
      var pad = this.getPad(tile);
      this.renderTile(tile, {
        position: 'absolute',
        width: tile.width,
        height: tile.height,
        left: round((this.width - (tile.width + pad.width)) / 2) + tile.x,
        top: round((this.height - (tile.height + pad.height)) / 2) + tile.y,
        right: '',
        bottom: ''
      });
    },
    
    // ----------------------------------------------------------------------
    //    DOCK MODE - position on one of the sides of the positioner
    // ----------------------------------------------------------------------
   
    dockMode: function(tile) {
      var pad = this.getPad(tile);
      this.renderTile(tile, {
        position: 'absolute',
        width: tile.width,
        height: tile.height,
        left: round((this.width - (tile.width + pad.width)) / 2),
        top: round((this.height - (tile.height + pad.height)) / 2),
        right: '',
        bottom: ''
      });
    },
        
    // ----------------------------------------------------------------------
    //    OFFSET MODE - position relative to the positioner origin
    // ----------------------------------------------------------------------
       
    // anchor: "tl|tr|bl|br", x: 0, y: 0
    // width: 0, height: 0
    offsetMode: function(tile) {
      var top = tile.anchor < 2
        , left = !(tile.anchor % 2);
      
      this.renderTile(tile, {
        position: 'absolute',
        width: tile.width,
        height: tile.height,
        top: top ? tile.y : 'auto',
        bottom: top ? 'auto' : tile.y,
        left: left ? tile.x : 'auto',
        right: left ? 'auto' : tile.x
      });
    },
    
    // ----------------------------------------------------------------------
    //    TARGET MODE - position relative to a target element
    // ----------------------------------------------------------------------
    
    // anchor: "tl|tr|bl|br", x: 0, y:0, target: $el 
    // axis: "h|v", width: 0, height: 0
    targetMode: function(tile) {
      var top = tile.anchor < 2
        , left = !(tile.anchor % 2)
        , tw = tile.target.outerWidth()
        , th = tile.target.outerHeight()
        , off = tile.target.offset()
        , width = tile.width
        , height = tile.height;
      
      // Set position and size before rendering
      tile.$el.css({
        position: 'absolute',
        width: width,
        height: height
      });
      
      // Render the tile before positioning
      tile.render();
      
      // Calculate the tile geometry
      var h = tile.$el.outerHeight()
        , w = tile.$el.outerWidth()
        , x = this.xPos(tile, tw, off.left, left)
        , y = this.yPos(tile, th, off.top, top)
        , overflow = tile.overflow;
        
      // Rectify the positioning if overflowing edge of screen
      if (this.rectify(w, x, this.width)) {
        x = this.xPos(tile, tw, off.left, left = !left);
      }
      if (this.rectify(h, y, this.height)) {
        y = this.yPos(tile, th, off.top, top = !top);
      }
      
      // Crop if still overflowing edge of screen
      if (w + x > this.width) {
        width = this.width - x - 10;
        overflow = 'auto';
      }
      if (h + y > this.height) {
        height = this.height - y - 10;
        overflow = 'auto';
      }
      
      // Set the tile geometry
      tile.$el.css({
        overflow: overflow,
        width: width,
        height: height,
        top: top ? y : 'auto',
        bottom: top ? 'auto' : y,
        left: left ? x : 'auto',
        right: left ? 'auto' : x
      });
    },
    
    // Rectify x or y coordinate
    rectify: function(size, offset, screen) {
      return (size + offset > screen 
        && (offset * 100 / screen) > 60);
    },
    
    // Calculate Y coordinate
    yPos: function(tile, th, ty, top) {
      return ((top ? ty + th : this.height - ty) 
        + tile.y - (tile.axis ? th : 0)
      );
    },
    
    // Calculate X coordinate
    xPos: function(tile, tw, tx, left) {
      return ((left ? tx : this.width - tx - tw)
        + tile.x + (tile.axis ? tw : 0)
      );
    }
    
  });
  
});