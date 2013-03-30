define(['jQuery', 'Underscore', 'Backbone', 'Dash'], 
  function($, _, Backbone, Dash) {
  
    // ------------------------------------------------------------------------
    //    TEST TILE
    // ------------------------------------------------------------------------
  
    return Dash.Tile.extend({
    
      className: 'test2',
    
      render: function() {
        this.$el.html('This is test 2');
        this.$el.css({
          backgroundColor: '#ddf',
          border: '4px solid #000',
          padding: '10px'
        });
        
        return this;
      }
    
    });
  
});