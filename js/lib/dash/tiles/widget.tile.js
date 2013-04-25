define(['jQuery', 'Underscore', 'Backbone', 'Dash', 'tile!dash/stacker'], 
  function($, _, Backbone, Dash, Stacker) {
    
  // ------------------------------------------------------------------------
  //    TILE : WIDGET
  // ------------------------------------------------------------------------
  
  var round	= Math.round;
  
  var Widget = Stacker.extend({
    
    className: 'tile widget',
    
    // Singleton/Global widget object - shared by all widgets
    _widgets: {
      tiles: [],          // Array of all instantiated widget tiles
      toFocus: null,     
      focusing: false,
      focused: null,
      focusOrder: 1
    },
    
    focus: false,
    order: 0,
    
    // Initialize the tile
    initialize: function() {
      var that = this;
      
      this.bindTile('head', { 
        type: 'dash/header',
        title: this.cid
      });
      
      this.bindTile('menu', {
        type: 'dash/menu'
      });
      
      this.bindTile('body', { 
        type: 'dash/test', 
        name: 'body' 
      });
      
      this.bindThis({
        focus: false,
        drop: true
      });
      
      this._widgets.tiles.push(this);
      //this._initFocus();
    },
    
    // close
    close: function() {
   //   this.setFocus(false);
      this._widgets.tiles = _.without(this._widgets.tiles, this);
      Stacker.prototype.close.apply(this, arguments);
    },
    
    // ----------------------------------------------------------------------
    //    FOCUSING
    // ----------------------------------------------------------------------
    
    // Set the focus
    setFocus: function(value) {
      if (value != this.focus) {
        console.log("setFocus",value,this.focus);
        value ? this._focusOn() : this._focusOff();
        if (value && this.parent == Dash.root) {
          console.log("FOCUS");
          Dash.root.addTile(this);
        }
        this.focus = value;  
      }
    },
    
    // Capture click events to obtain focus
    _initFocus: function() {
      console.log("initFocus");
      var that = this;
      this.addEvent(this.el, 'mousedown', function(e) {
        var widgets = that._widgets;
        widgets.toFocus = that;
        console.log(that.cid, "FOCUS DEFER");
        _.defer(function() {
          if (widgets.toFocus) {
            console.log(widgets.toFocus.cid, "DEFER FOCUS");
            widgets.toFocus.setFocus();
            widgets.toFocus = null;
          }
        });
      });
    },
    
    // Obtain the focus
    _focusOn: function() {
      console.log("focuson");
      this.order = this._widgets.focusOrder++;
      if (this._widgets.focused) {
        this._widgets.focusing = true;
        this._widgets.focused.setFocus(false);
        this._widgets.focusing = false;
      }
      this._widgets.focused = this;
    },
    
    // Re-focus the highest order widget in the dash
    _focusOff: function() {
      console.log("focusoff");
      if (!this._widgets.focusing) {
        var highest = 0
          , target = null
          , that = this;

        _.each(this._widgets, function(tile) {
          if (tile != that && tile.order > highest) {
            highest = tile.order;
            target = tile;
          }
        });
        
        this._widgets.focused = null;
        if (target) {
          target.setFocus(true);
        }
      }
    },
    
    // ----------------------------------------------------------------------
    //    DRAG & DROP
    // ----------------------------------------------------------------------
    
    dragInit: function(ev, dd) {
      dd.saved = this.saveState.call(this.parent, this, this);
      return true;
    },
    
    dragFinish: function(ev, dd) {
      if (dd.started && !dd.committed) {
        dd.saved.parent.addTile(dd.saved.child, dd.saved.index);
      }
    },
    
    // Save the state of the widget before dragging
    saveState: function(child, tiles) {
      if (this.prune && this.tiles.length == 1 && this.parent) {
        return Widget.prototype.saveState.call(this.parent, this, { 
          type: this.type,
          tiles: tiles
        });
      } else return {
        index: this.indexOf(child),
        parent: this,
        child: tiles
      }
    },
    
    //  the drop-zones
    dropInit: function(ev, dd) {
      if (dd.tile instanceof Widget && this.parent != Dash.root) {
        if (!this._widgets.$cover) {
          this._widgets.$cover = $('<div class="drop-cover">'
            + '<div class="cover-inner">'
            + '<div class="cover-head">&nbsp;</div>'
            + '<div class="cover-body">&nbsp;</div>'
            + '<div class="cover-foot">&nbsp;</div>'
            + '</div></div>'
          )
          .css('visibility', 'hidden')
          .appendTo(Dash.root.$el);
        }
        return true;
      }
      return false;
    },
    
    // Enter a drop-zone
    dropOver: function(ev, dd) {
      this._widgets.$cover.css('visibility', 'visible');
    },
    
    // Move within a drop-zone
    dropMove: function(ev, dd) {
      var w = dd.dropWidth
        , h = dd.dropHeight
        , px = round(dd.dropX * 100 / w)
        , py = round(dd.dropY * 100 / h)
        , qa = px > py
        , qb = (100 - px) > py
        , ch = round(h / 2)
        , cw = round(w / 2)
        , xor = !(!qa ^ !qb);
 
      dd.dropSide = (qb ? 2 : 1) + (xor ? 2 : 0);
      
      this._widgets.$cover.css({
        left: dd.dropLeft + ((qa && !qb) ? cw : 0),
        top: dd.dropTop + ((!qa && !qb) ? ch : 0),
        width: (xor ? w : cw) - 2,
        height: xor ? ch : h
      });
    },
    
    // Exit a drop-zone
    dropOut: function(ev, dd) {
      this._widgets.$cover.css('visibility', 'hidden');
    },
    
    // Commit a drop
    // dd.dropSide = 1(right), 2(left), 3(bottom), 4(top)    
    dropCommit: function(ev, dd) {
      var axis = this.superFn('axisTo', 0, 1, 2)
        , daxis = (dd.dropSide < 3) ? 1 : 2
        , after = dd.dropSide % 2
        , index = this.parent.indexOf(this);
        
      if (!axis || daxis != axis) {
        var tiles = [dd.tile];
        after ? tiles.unshift(this) : tiles.push(this);
        this.parent.addTile({ type: this.parent.type, tiles: tiles}, index);
      } else {
        this.parent.addTile(dd.tile, index + (after ? 1 : 0));
      }
      return true;
    },
    
    // Finish the drop-zone
    dropFinish: function(ev, dd) {
      if (this._widgets.$cover) {
        this._widgets.$cover.remove();
        this._widgets.$cover = null;
      }
    }
    
  });

  return Widget;

});