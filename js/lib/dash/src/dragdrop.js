  
  // ------------------------------------------------------------------------
  //    DRAG AND DROP CONSTRUCTOR
  // ------------------------------------------------------------------------
  
  var Dragdrop = Dash.Dragdrop = function(ev) {
    var $target = $(ev.target)
      , $tile = $target.closest('.tile')
      , tile = $tile.data('tile');

    // Set the properties
    this.tile = ($target[0] == $tile[0]) ? tile : $target;
    this.origin = tile;
    this.target = $target;
    this.startX = ev.pageX;
    this.startY = ev.pageY;
    this.zones = [];
    
    // Bubble up the tree to find active drag handler
    while (!tile.dragInit(ev, this)) {
      tile = tile.parent;
    }
    // Found handler
    if (tile) {
      this.handler = tile;
      textSelection(false);
    }
  };
  
  Dragdrop.prototype = {
  
  // ------------------------- SET on dragInit() --------------------
    tile: null,           // {tile} jQuery el or tile object          
    autodrag: true,       // {boolean} automatic dragging
    copyable: false,      // {boolean} true=copy | false=move
    dropable: true,       // {boolean} is this droppable?
    restorable: true,     // {boolean} true=uncommitted move will restore
    pxtodrag: 2,          // {integer} pixels to move to start

    // ------------------------- SET by system ------------------------
    handler: null,        // {object} drag handler 
    origin: null,         // {tile} The originating tile
    target: null,         // {jquery} element that initiated the drag
    startX: 0,            // {integer} Starting x-coordinate
    startY: 0,            // {integer} Starting y-coordinate
    deltaX: 0,            // {integer} Change in x-coordinate
    deltaY: 0,            // {integer} Change in y-coordinate
    tileX: 0,             // {integer} Starting tile x-coordinate
    tileY: 0,             // {integer} Starting tile y-coordinate
    pageX: 0,             // {integer} Position of cursor on page
    pageY: 0,             // {integer} Position of cursor on page
    dropX: 0,             // {integer} Position within drop-zone
    dropY: 0,             // {integer} Position within drop-zone
    dropWidth: 0,         // {integer} Width of drop-zone
    dropHeight: 0,        // {integer} Height of drop-zone
    dropTop: 0,           // {integer} Top page offset of drop-zone
    dropLeft: 0,          // {integer} Left page offset of drop-zone
    started: false,       // {boolean} Has the dragging started
    committed: false,     // {boolean} was able to commit
    zones: null,          // {array} List of potential drop zones
    zone: null,           // {object} Current drop zone with bounds
  
    // ----------------------------------------------------------------------
    //    START THE MOVE
    // ----------------------------------------------------------------------
    
    start: function(root, ev) {
      if (abs(this.startX - ev.pageX) > this.pxtodrag
       || abs(this.startY - ev.pageY) > this.pxtodrag) {
        
        if (this.autodrag) {
          this.tile = this.prepTile(root, this.tile);
        }
        if (this.dropable) {
          this.zoneInit.call(root, ev, this);
        }
        root.set('cover', 'move');
        this.handler.dragStart(ev, this);
        
        return true;
      }
      return false;
    },
  
    // ----------------------------------------------------------------------
    //    MOVE THE MOUSE
    // ----------------------------------------------------------------------
   
    move: function(root, ev) {
      if (this.started || (this.started = this.start(root, ev))) {
        
        // Set page and change values
        this.pageX = ev.pageX;
        this.pageY = ev.pageY;
        this.deltaX = ev.pageX - this.startX;
        this.deltaY = ev.pageY - this.startY;

        // Detect if we have left or entered a new zone
        if (!this.inZone(this.zone, ev.pageX, ev.pageY)) {
          this.zone = this.changeZone(ev);
          if (this.zone.drop) {
            this.dropLeft = this.zone.drop.l;
            this.dropTop = this.zone.drop.t;
            this.dropWidth = this.zone.drop.r - this.dropLeft;
            this.dropHeight = this.zone.drop.b - this.dropTop;
          }
        }
        // Drag & Drop move callbacks
        this.handler.dragMove(ev, this);
        if (this.zone.tile) {
          this.dropX = this.pageX - this.zone.drop.l;
          this.dropY = this.pageY - this.zone.drop.t;
          this.zone.tile.dropMove(ev, this);
        }
        // Move the tile
        if (this.autodrag) {
          this.tile.set({
            x: this.tileX + this.deltaX,
            y: this.tileY + this.deltaY
          });
        }
      }
      stopEvent(ev);
    },
    
    // ----------------------------------------------------------------------
    //    END THE DRAGGING
    // ----------------------------------------------------------------------
   
    end: function(root, ev) {
      var drop = (this.zone && this.zone.tile) ? this.zone.tile : null;
      
      // dropOut, dragEnd, dropCommit & dragComplete
      if (this.started) {
        if (drop) drop.dropOut(ev, this);
        this.handler.dragEnd(ev, this);  
        
        if (drop) {
          this.committed = drop.dropCommit(ev, this);
        }
        if (this.autodrag) {
          if (this.tile.isType(Dragger)) {
            if (this.copyable || this.committed) this.tile.close();
            else if (this.restorable) this.tile.dragRestore();
          } else {
            // >>>>>>>>>>>>>>>> DEAL WITH AUTODRAG UNCOMMITTED TILES HERE <<<<<<<<<<<<<<<<<<
          }
        }
        root.set('cover');
      }
      // Re-enable text selection
      textSelection(true);
      
      // dropFinish & dragFinish
      if (drop) drop.dropFinish(ev, this);
      this.handler.dragFinish(ev, this);
    },
    
    // ----------------------------------------------------------------------
    //    TURN ELEMENT INTO TILE & ATTACH TO ROOT
    // ----------------------------------------------------------------------
    
    prepTile: function(root, tile) {
      
      // Turn a jquery element into a dragger tile 
      // (NEED TO TEST FOR DOM ELEMENT TOO)
      if (isJQuery(tile)) {
        tile = { 
          type: Dash.Dragger, 
          spawner: this.origin,
          dd: this
        };
      } 
      // Make a copy of a tile 
      // (IS THIS REALLY WHAT WE WANT HERE?)
      else if (isTile(tile) && this.copyable) {
        tile = tile.get();
      }
      // Attach the tile to the root context
      if (_.isObject(tile)) {
        tile = root.addTile(tile);
        tile.set('position', 'offset');        
        this.tileX = tile.x;
        this.tileY = tile.y;
        return tile;
      }
      return null;
    },
    
    // ----------------------------------------------------------------------
    //    INITIALIZE THE DROP ZONES
    //    NOTE: This will be called within a tile context
    // ----------------------------------------------------------------------
    
    zoneInit: function(ev, dd, index) {
      // Determine if this is a valid drop-zone
      if (this.drop && this != dd.tile && this.dropInit(ev, dd)) {
        var off = this.$el.offset()
          , zindex = this.$el.css('zIndex');
          
        // represent the stacking order as a string
        if (parseInt(zindex)) {
          var pos = this.$el.css('position');
          if (pos == 'relative' || pos == 'absolute') {
            index = (index ? index + '.' : '') + zindex;
          }
        }
        // Push the zone onto the zone array
        dd.zones.push({ 
          tile: this,                             // tile
          t: off.top,                             // top
          l: off.left,                            // left
          r: off.left + this.$el.outerWidth(),    // right
          b: off.top + this.$el.outerHeight(),    // bottom
          z: index                                // zindex
        });
        
      } 
      // Recurse to the children tiles
      else {
        _.each(this.tiles, function(tile) {
          Dragdrop.prototype.zoneInit.call(tile, ev, dd, index);
        });
      }
    },
    
    // ----------------------------------------------------------------------
    //    TEST IF CURSOR IS WTIHIN A DROP ZONE
    // ----------------------------------------------------------------------
    
    inZone: function(bounds, x, y) {
      return (bounds 
        && x >= bounds.l 
        && x <= bounds.r 
        && y >= bounds.t 
        && y <= bounds.b
      );
    },
    
    // ----------------------------------------------------------------------
    //    TRANSITION TO A NEW ZONE
    // ----------------------------------------------------------------------
    
    changeZone: function(ev) {
      var zone = this.findZone(ev.pageX, ev.pageY);
      
      if (!this.zone || this.zone.tile != zone.tile) {
        if (this.zone && this.zone.tile) {
          this.zone.tile.dropOut(ev, this);
        }
        if (zone && zone.tile) {
          zone.tile.dropOver(ev, this);
        }
      }
      return zone;
    },
    
    // ----------------------------------------------------------------------
    //    FIND NEW DROP ZONE
    // ----------------------------------------------------------------------
    
    findZone: function(x, y) {
      var l = BIG, r = BIG, t = BIG, b = BIG, zone = null;
      
      // Iterate through all the zones to find the next one
      for (var di = 0, len = this.zones.length; di < len; di++) {
        var dz = this.zones[di], deltaA, deltaB, bound = 0
        
        // Are we bound on X? Find nearest edges
        if ((deltaB = x - dz.l) > 0) { 
          if ((deltaA = dz.r - x) > 0) {
            if (deltaB < l) l = deltaB;
            if (deltaA < r) r = deltaA; 
            bound++;
          } else if (-deltaA < l) l = -deltaA;
        } else if (-deltaB < r) r = -deltaB;
        
        // Are we bound on Y? Find nearest edges
        if ((deltaB = y - dz.t) > 0) { 
          if ((deltaA = dz.b - y) > 0) {
            if (deltaB < t) t = deltaB;
            if (deltaA < b) b = deltaA; 
            bound++;
          } else if (-deltaA < t) t = -deltaA;
        } else if (-deltaB < b) b = -deltaB;
        
        // remember zone if bound on x & y & highest stacking order
        if (bound == 2 && (!zone || this.isAbove(dz.z, zone.z))) {
          zone = dz;
        }
      }
      // return the new zone
      return { 
        drop: zone,
        tile: zone ? zone.tile : null, 
        l: x - l, 
        r: x + r, 
        t: y - t, 
        b: y + b 
      }
    },
    
    // ----------------------------------------------------------------------
    //    COMPARE STACKING ORDER OF TWO TILES
    // ----------------------------------------------------------------------
    
    isAbove: function(newz, oldz) {
      if (!oldz) return true;
      if (!newz) return false;
      var news = newz.split('.');
      var olds = oldz.split('.');
      var len = news.length < olds.length ? news.length : olds.length;
      for (var i = 0; i < len; i++) {
        if (parseInt(news[i]) < parseInt(olds[i])) return false;
      }
      return true;
    }
    
  };