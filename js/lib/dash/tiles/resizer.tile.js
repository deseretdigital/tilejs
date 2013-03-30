define(['jQuery', 'Underscore', 'Backbone', 'Dash'], 
  function($, _, Backbone, Dash) {
    
  // ------------------------------------------------------------------------
  //    TILE : RESIZER
  // ------------------------------------------------------------------------
   
  var MIN_SIZE = 20
    , tproto = Dash.Tile.prototype
    , round	= Math.round
    , floor = Math.floor
    , Edge = Dash.Tile.extend({
        className: 'tile edge drag',
        type: '_edge'
    });

  return Dash.Tile.extend({
    
    className: 'tile resizer',
    
    // Initialize the tile
    initialize: function() {
      this.bindThis({
        tiles: undefined,
        axis: {
          inherit: 0,
          horizontal: 1,
          vertical: 2
        },
        edging: 7,
        prune: true
      });
    },
    
    // Initialize the children
    childInit: function(tile) {
      this.bindChild(tile, {
        size: 0
      });
    },
    
    shouldPrune: function() {
      return (this.tiles.length < 2 && this.parent && this.prune);
    },
    
    axisTo: function(w, h) {
      return (this.axis || this.superFn('axisTo', 1, 2, 1)) == 1 ? w : h;
    },
    
    edgeCount: function() {
      return floor(this.tiles.length / 2);    
    },
    
    // Get only non edge children
    getTiles: function() {
      for (var i = 0, l = this.tiles.length, out = []; i < l; i++) {
        if (!this.tiles[i].isType(Edge)) {
          out.push(this.tiles[i].get());
        }
      }
      return out;
    },
    
    length: function() {
      return floor((this.tiles.length + 1) / 2);
    },
    
    indexOf: function(tile) {
      return floor(tproto.indexOf.call(this, tile) / 2);
    },
    
    atIndex: function(index) {
      return tproto.atIndex.call(this, index * 2);
    },
    
    // Attach a tile and an edge
    _attachTile: function(tile, index) {
      var attach = tproto._attachTile
        , len = this.length()
        , pos = _.isUndefined(index) ? undefined : index * 2;

      if (len) attach.call(this, this._toTile(Edge), pos);
      attach.call(this, tile, pos);
      
      return tile;
    },
    
    // Detach a tile and an edge
    _detachTile: function(tile) {
      var detach = tproto._detachTile
        , index = this.indexOf(tile)
        , offset = (index < (this.length() - 1) ? 0 : 1);
      
      detach.call(this, tile);
      
      var edge = this.tiles[index * 2 - offset];
      if (edge && edge.isType(Edge)) {
        detach.call(this, edge).close();
      }
      this.deferChange(this._prune);
    },
    
    _prune: function() {
      if (this.shouldPrune()) {
        if (this.tiles.length) {
          var move = this.tiles[0];
          if (!move.axis) move.axis = this.axisTo(2, 1); 
          this.replace(move);
        }
        this.close();
      }
    },
    
    // --------------------------------------------------------------------
    //    Render
    // --------------------------------------------------------------------
    
    render: function() {
      var tpc = 0, cpc = 0, cno = 0, px, i, tile
        , end = this.tiles.length - 1
        , ex = this.edging
        , wx = this.getWidth()
        , hx = this.getHeight()
        , hz = this.axisTo(true, false)
        , tx = hz ? wx : hx
        , ax = tx;
        
this.seeTiles(this.cid + ' RESIZER', this.tiles);      
      // calculate aggregate totals
      for (i = 0; i <= end; i++) {
        tile = this.tiles[i];
        if (tile.isType(Edge)) tx -= ex;
        else if (!tile.size) cno++;
        else {
          tpc += tile.size;
          cpc++;
        }
      }
      var avg = 100 / (cno + cpc);

      // size all the children
      for (i = 0; i <= end; i++) {    
        tile = this.tiles[i];
        
        if (i == end) px = ax;
        else if (tile.isType(Edge)) px = ex;
        else if (!tile.size) px = round((avg * tx) / 100);
        else px = round((tile.size * avg * cpc * tx) / (tpc * 100));
        ax -= px;
        
        this.renderTile(tile, {
          width: (hz ? px : wx) - this.getPad(tile).width,
          height: (hz ? hx : px) - this.getPad(tile).height,
          display: hz ? 'inline-block' : 'block',
          cursor: !tile.isType(Edge) ? '' : hz ? 'col-resize' : 'row-resize'
        });
      }
      return this;
    },
    
    // --------------------------------------------------------------------
    //    Drag an Edge
    // --------------------------------------------------------------------
    
    // Inform the drag sub-system that we will roll-our-own drag
    dragInit: function(ev, dd) {
      dd.autodrag = false;
      return true;
    },
    
    // Take a snapshot of the children's sizes
    dragStart: function(ev, dd) {
      Dash.root.set('cover', this.axisTo('col-resize', 'row-resize'));

      dd.axis = this.axisTo('width', 'height');
      dd.index = this.indexOf(dd.tile) + 1;
      dd.len = this.length();
      dd.sizes = [];      
      dd.sum = 0;
      
      for (var i = 0; i < dd.len; i++) {
        var size = this.atIndex(i)[dd.axis];
        dd.sizes.push(size);
        dd.sum += size;
      }
    },
    
    // Drag an edge
    dragMove: function(ev, dd) {
      var off = this.axisTo(dd.deltaX, dd.deltaY)
        , after = off > 0;
      
      var carry = this.dragShift(dd,
        dd.index - (after ? 0 : 1),
        after ? off : -off,
        after ? 1 : -1
      );
      this.dragShift(dd,
        dd.index - (after ? 1 : 0),
        carry + (after ? -off : off),
        after ? -1 : 1
      );
    },

    // Shift a neighbor tile
    dragShift: function(dd, index, offset, next) {
      if (index < 0 || index == dd.len) return offset;
      
      var overflow = 0
        , size = dd.sizes[index] - offset
        , tile = this.atIndex(index);
        
      if (size < MIN_SIZE) {
        overflow = MIN_SIZE - size;
        size = MIN_SIZE;
      }
      tile.size = round((size / dd.sum) * 1000);
      
      var opts = {};
      opts[dd.axis] = size;
      this.renderTile(tile, opts);
      
      return this.dragShift(dd, index + next, overflow, next);
    }    
    
  });
  
});