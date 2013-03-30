define([
  'jQuery', 
  'Underscore', 
  'Backbone',
  'Dash',
  'tile!dash/positioner'
  ], function($, _, Backbone, Dash, Positioner) {
    
  // ------------------------------------------------------------------------
  //    TILE : ROOT - single-page application root
  // ------------------------------------------------------------------------

  return Positioner.extend({
    
    el : 'body',        // Bind to DOM.body
    
    // ---------------------------------------------------------------------
    //    INITIALIZATION
    // ---------------------------------------------------------------------
    
    initialize: function() {
      Positioner.prototype.initialize.apply(this, arguments);
      
      var that = this
        , dd = null;
      
      this.$cover = $('<div class="cover" />');
      this.bind('cover', { filter: '' });

      // Bind to window resize
      $(window).resize(function() {
        that.render().rendered();
      });
      
      this.addEvent(document, 'mousedown', function(ev) {
        that.clickout(ev);
      });
      
      // Bind to mouse-down - return false on drag to prevent scrolling
      $(document).on('mousedown touchstart', '.drag', function(ev) { 
        if ((dd = new Dash.Dragdrop(ev)) && dd.handler) return false; 
        return (dd = undefined);
      });
      
      // Bind to mouse-move (prevent propagation for better performance)
      this.addEvent(document, 'mousemove touchmove', function(ev) {
        if (dd) dd.move(that, ev);
      });

      // Bind to mouse-up
      $(document).on('mouseup touchend', function(ev) { 
        dd && (dd = dd.end(that, ev));
      });
      
    },
    
    // ---------------------------------------------------------------------
    //    CLICKOUT DETECTION
    // ---------------------------------------------------------------------
    
    clickout: function(ev) {
      var ctiles = this._global.clickout
        , $target = $(ev.target)
        , $tile = $target.closest('.tile')
        , tile = $tile.data('tile')
        , i = 0, ctile, clist;
        
      // Deal with a clickout
      if (ctiles.length && (!(ctile = tile.isClickIn())
          || ((i = _.indexOf(ctiles, ctile) + 1) < ctiles.length))) {
        
        clist = _.rest(ctiles, i);
        while ((ctile = clist.pop())) {
          if (ctile._running) ctile.onClickout();
        }
      }
    },
   
    // ---------------------------------------------------------------------
    //    CHANGING & RENDERING
    // ---------------------------------------------------------------------
    
    render: function(tile) {
      this.width = window.innerWidth;
      this.height = window.innerHeight;
      return Positioner.prototype.render.apply(this, arguments);
    },
    
    // ---------------------------------------------------------------------
    //    IFRAME COVERING
    // ---------------------------------------------------------------------    
    
    setCover: function(value) {
      if (this.cover && !value) {
        this.$cover.detach();
        this.cover = '';
      } 
      else if (!this.cover && value) {
        this.$cover
          .css('cursor', _.isString(value) ? value : '')
          .prependTo(this.$el);
        this.cover = value;
      }
    },
    
    getCover: function(value) {
      return this.cover;
    }
    
  });

});