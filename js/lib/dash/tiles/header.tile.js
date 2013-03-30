define(['jQuery', 'Underscore', 'Backbone', 'Dash'], 
  function($, _, Backbone, Dash) {
    
  // ------------------------------------------------------------------------
  //    TILE : HEADER
  // ------------------------------------------------------------------------
  
  return Dash.Tile.extend({
    
    className: 'tile header',
    
    // Initialize
    initialize: function(options) {
      this.bindThis({
        title: '',
        drag: true,
        visible: true,
        pinned: true,
        focus: 0
      });
    },
    
    // Set the drag.tile to parent widget
    dragInit: function(ev, dd) {
      dd.tile = this.parent;
    },
    
    // Render the header
    render: function() {
      this.$el.html(
        '<a href="#" class="close">x</a><h2>' + this.title + '</h2>'
      );
      return this;
    },
    
    // DOM Events
    events: {
      "click .close": "closeBtn"
    },
    
    // Close Event
    closeBtn: function() {
      this.superFn('close');
    }
    
  });
  
});