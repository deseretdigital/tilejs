define(['jQuery', 'Underscore', 'Backbone', 'Dash'], 
  function($, _, Backbone, Dash) {
    
  // ------------------------------------------------------------------------
  //    TILE : TEST
  // ------------------------------------------------------------------------
  
  return Dash.Tile.extend({
    
    className: 'tile test',
    
    count: 0,
    
    render: function() {
      this.$el.html('');
      
      this.count++;
      this.$el.append('<div style="float: right; font-weight: bold; color: #900; font-size: 20px;">' + this.count + '</div>');
    
      
      this.$el.append('<div class="btn drag" style="cursor: move; margin-bottom: 7px;">Drag This</div>');
      this.$el.append('<a href="#modal">Modal</a>');
      this.$el.append('<a href="#flyout">Flyout</a>');
      this.$el.append('<a href="#menu">Menu</a>');
       
      return this;
    },
    
    events: {
      'click a': 'link'
    },
    
    link: function(ev) {
      Dash.root.add({ 
        type: 'menu',
        spawner: this,
        target: $(ev.target),
        position: 'target',
        anchor: 'tl'
      });
      return false;
    }
    
  });
  
});