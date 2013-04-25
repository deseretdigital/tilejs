define(['jQuery', 'Underscore', 'Backbone', 'Dash'], 
  function($, _, Backbone, Dash) {
    
  // ------------------------------------------------------------------------
  //    TILE : MENU
  // ------------------------------------------------------------------------
  
  return Dash.Tile.extend({
    
    tagName: 'ul',
    className: 'tile menu',
    
    close: function() {
      Dash.Tile.prototype.close.call(this, true);
    },
    
    render: function() {
      if (this.parent == Dash.root) {
        this.setClickout(true);
      }
      this.$el.toggleClass('popout', this.parent == Dash.root);
      this.$el.html('<li>one</li><li>two</li><li>three</li><li>four</li>');
      return this;
    },
    
    onClickout: function() {
      this.close();
    },
    
    events: {
      'click li': 'link'
    },
    
    link: function(ev) {
      var flyout = this.parent == Dash.root;
      
      Dash.root.addTile({ 
        type: 'menu',
        spawner: this,
        target: $(ev.target),
        position: 'target',
        anchor: 'tl',
        axis: flyout ? 'horizontal' : 'vertical'
      });
      return false;
    }
    
  });
  
});