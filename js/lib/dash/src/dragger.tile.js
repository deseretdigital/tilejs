  
  // ------------------------------------------------------------------------
  //    TILE : DRAGGER (for containing HTML elements for drag-and-drop)
  // ------------------------------------------------------------------------
  
  var Dragger = Dash.Dragger = Tile.extend({
    
    // Initialize the view
    initialize: function(options) {
      this.dd = options.dd;
      
      this.$source = this.dd.tile;
      this.captureGeometry(this.$source); 

      this.setElement(this.$source
        .clone()
        .removeAttr('id')
        .css('display', 'block')
      );
        
      if (this.dd.copyable) this.$source = null;
      else if (this.dd.restorable) {
        this.display = this.$source.css('display');
        this.$source.css('display', 'none');
      } else {
        this.$source.remove();
        this.$source = null;
      }
      
      this.setDrag(true);
    },
    
    dragInit: function(ev, dd) {
      return dd.handler;
    },
    
    // Restore a failed drag
    dragRestore: function() {
      this.$source.css('display', this.display);
      this.$source = null;
      this.close();
    },
    
    // Close the view
    close: function() {
      if (this.$source) {
        this.$source.remove();
      }
      this.$source = null;
      this.dd = null;
      
      Dash.Tile.prototype.close.apply(this, arguments);
    }
    
  });
  