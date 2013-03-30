    
  // ------------------------------------------------------------------------
  //    TILE : Error
  // ------------------------------------------------------------------------
    
  var Error = Dash.Error = Tile.extend({
    
    tagName: 'ul',
    className: 'error',
    
    initialize: function(options) {
      this.error = options.error;
    },
    
    render: function() {
      
      console.log("Require Loading Error:", this.error);
      
      this.$el.html([
        '<li><h2>Load Error!</h2></li>',
        '<li>', 'Type: ', this.error.type, '</li>',
        '<li>', 'Name: ', this.error.name, '</li>',
        '<li>', 'Path: ', this.error.path, '</li>',
      ].join(''));
      
      return this;
    }
    
  });
