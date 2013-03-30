  
  // ------------------------------------------------------------------------
  //    MASTER TILE OBJECT
  // ------------------------------------------------------------------------
  
  /* Notes:
   *  I don't want to use a model for my options because of:
   *  
   *  There is no way to set an option without eventually firing a change
   *  event.  Setting with SILENT only defers the event, and when setting
   *  a value during rendering, I don't want a change event to ever be
   *  triggered by the change. I want changes to accumulate across the 
   *  tile tree, and when all changes are done, I want to find the top-
   *  most change and propagate updates down the tree. The order that updates
   *  happen in is very important, and it's impossible to controll of that 
   *  when using change events on models.
   *  
   *  There is no way to control the order that change events fire in. 
   *  That's important because after doing batch changes, I want to start
   *  rendering from the top of the tree down, and there is no way to 
   *  guarantee order with model change events.  If a parent is bound to a 
   *  child model and the child makes a change, it's impossible to guarantee
   *  that the parent will fire first.  Or, for that matter, I don't want to
   *  fire a change event to a child if an event is going to a parent, because
   *  the parent will automatically call render on it's children.
   *
   *  Tile options are recursive, and nest inside one-another.  Backbone
   *  models aren't really designed for recursive setters.  Since tile options
   *  can bind with parent and child options recursively, there is a risk of
   *  accidentally creating getter and setter loops, which if not detected 
   *  and prevented will lock up the browser.  This has happended to me before
   *  with backbone models.
   */
  
  var Tile = Dash.Tile = Backbone.View.extend({

    // Configuration
    type: '_tile',            // {string} Normalized full-path of tile
    className: 'tile',        // {string} Backbone.View className
    
    // Drag & Drop
    drag: false,              // {boolean} is draggable
    drop: false,              // {boolean} is droppable
    
    // DOM Relationships
    parent: null,             // {tile} parent tile     
    tiles: null,              // {array} children tiles
    
    // Spawn Relationships
    spawner: null,            // {tile} spawn parent tile
    spawned: null,            // {array} spawned children tiles

    // Changed Children
    mark: 0,                  // {integer} indicate parent-child change
    marked: null,             // {array} changed children
    
    // Changed Properties
    change: 0,                // {integer} indicate local-property change
    changed: null,            // {object} changed properties
    
    // Change Deferral
    defer: 0,                // {integer} indicate there is a deferral
    
    // Singleton/Global Object
    _global: {
      count: 0,               // {integer} change counter
      tiles: [],              // {array} list of changed tiles
      defered: [],            // {array} defered callbacks
      clickout: []            // {array} tiles with clickout enabled
    },
    
    // Clickout State
    _clickout: false,          // {boolean} clickout state
    
    _running: true,           // {boolean} is this tile still running
    _root: false,             // {boolean} is this the root DOM Element
    
    // ----------------------------------------------------------------------
    //    BACKBONE-VIEW OVERRIDES
    // ----------------------------------------------------------------------
    
    // Override Backbone _configure & roll our own local options
    _configure: function(options) {
      Backbone.View.prototype._configure.apply(this, arguments);
      this._wrapRender();
      this.options = new Options(options, this);
      this.tiles = [];
      this.spawned = [];
      this.bind('spawner');
    },
    
    _wrapRender: function() {
      var render = this.render
        , that = this;
        
      this.render = function() {
        return render.apply(that, arguments).rendered();
      };
    },
    
    // Is the element attached to the DOM?
    _isAttached: function(el) {
      var body = document.getElementsByTagName('body')[0];
      return (el == body || $.contains(body, el));
    },
    
    setElement: function() {
      Backbone.View.prototype.setElement.apply(this, arguments);
      this.$el.attr('id', this.cid).data('tile', this);
      if (this._isAttached(this.el)) this._root = true;
    },
    
    // ----------------------------------------------------------------------
    //    CONSTRUCTOR-DESTRUCTOR
    // ----------------------------------------------------------------------
    
    /**
     * Initialize the Tile
     * @parm {object} options   Backbone view options
     */
    initialize: function(options) {
      this.bind('tiles');
    },
    
    /**
     * Close the tile
     * 
     * @param {boolean} delspawned (true=close spawned children)
     */
    close: function(delspawned) {
      if (this._running) {
        this._running = false;
        this.despawn(delspawned);
        this.detach();
        this.setTiles();
        this.options.close();
      }
    },
    
    /**
     * Add one or more tile(s)
     * 
     * @param {(object|fn|array|string)} tile   
     * @param {integer} index (insertion index / optional)
     * @param {object} extend (extend tile options / optional)
     */
    add: function(tile, index, extend) {
      var tiles = undefined
        , that = this;
      
      if (tile) {
        this.beginChange();
        if (_.isArray(tile)) {
          tiles = _.map(tile, function(tile) {
            return that._addTile(tile, index, extend);
          });
        } else {
          tiles = this._addTile(tile, index, extend);
        }
        this.endChange();
      }
      return tiles;
    },
    
    /**
     * Detach the tile from it's parent
     */
    detach: function() {
      if (this.parent) {
        var parent = this.parent;
        parent.beginChange();
        parent._detachTile(this);
        parent.endChange();
      }
      return this;
    },
    
    /**
     * Replace this tile with another
     */
    replace: function(tile) {
      if (this.parent) {
        var parent = this.parent;
        parent.beginChange();
        parent.add(tile, this.parent.indexOf(this));
        this.detach();
        parent.endChange();
      }
      return this;
    },
    
    /**
     * Find a tile
     */
    find: function(cid) {
      if (this.cid == cid) return this;
      else for (var i = 0, l = this.tiles.length; i < l; i++) {
        var tile = this.tiles[i].find(cid);
        if (tile) return tile;
      }
      return undefined;
    },
    
    /**
     * Execute a parent function
     * 
     * @param {string} name (name of parent function)
     * @param {*} defalt (default value if not defined) 
     * @param {*} ... (additional arguments...)
     */
    superFn: function(name, defaultTo) {
      if (this.parent && (name in this.parent)) {
        var args = slice.call(arguments, 2);
        return this.parent[name].apply(this.parent, args);
      }
      return defaultTo;
    },
    
    /**
     * Test if this is a type of Tile
     */
    isType: function(type) {
      return (this instanceof type);
    },
    
    /**
     * Test to see if the tile has been sized
     */
    isSized: function() {
      var changed = this.changed;
      return (changed
        && (!_.isUndefined(changed.width) 
        || !_.isUndefined(changed.height))); 
    },
    
    /**
     * Test to see if render involves reflow
     */
    isReflow: function() {
      return (this.isSized() || !this.marked);
    },
    
    /**
     * Get debugging information
     */
    debug: function(level) {
      level || (level = 1);
      console.log(
        "                                       ".slice(-level)
        + this.cid 
        + ' (' + this.type + ')',
        this.change, this.mark, this.changed
      );
      if (this.type != 'component/widget') {
        for (var i = 0, l = this.tiles.length; i < l; i++) {
          this.tiles[i].debug(level + 2);
        }
      }
    },
     
    // ----------------------------------------------------------------------
    //    SPAWNED RELATIONSHIPS
    // ----------------------------------------------------------------------
    
    setSpawner: function(tile) {
      if (this.spawner) {
        this.spawner.despawn(this);
      }
      if (tile) {
        this.spawner = tile;
        tile.spawned.push(this);
      }
    },
    
    /**
     * Undo spawn relationships
     * 
     * @param {tile} tile (use this to detach child from this)
     *        {undefined} tile (use this to detach all children)
     *        {true} tile (use this to close all children)
     */
    despawn: function(tile) {
      var spawned;
      
      if (isTile(tile)) {
        this.spawned = _.without(this.spawned, tile);
        tile.spawner = null;
      } else {
        while ((spawned = this.spawned.pop())) {
          spawned.spawner = null;
          if (tile === true) spawned.close();
        }
        if (this.spawner) {
          this.spawner.despawn(this);
        }
      }
    },
    
    // ----------------------------------------------------------------------
    //    TILES
    // ----------------------------------------------------------------------
    
    // Get all the children
    getTiles: function() {
      return _.map(this.tiles, function(tile) {
        return tile.get();
      });
    },
    
    // Close all the children
    setTiles: function(tiles) {
      var tile;
      
      this.beginChange();
      while ((tile = this.tiles.pop())) {
        tile.close();
      }      
      this.add(tiles);
      this.endChange();
    },
    
    // Get the tile count
    length: function() {
      return this.tiles.length;
    },

    // Get the tile at a specified index
    atIndex: function(index) {
      return this.tiles[index];
    },
    
    // Find the index of a tile
    indexOf: function(tile) {
      for (var i = 0, l = this.tiles.length; i < l; i++) {
        if (this.tiles[i] == tile) return i;
      }
      return undefined;
    },
    
    // Initialize a parent tile
    // - override to do intialization
    parentInit: function(parent) {},
    
    // Initialize a child tile
    childInit: function(tile) {},
    
    // Close a child tile
    closeChild: function(tile) {},
    
    // Capture the DOM tile geometry
    // - prevent setter->render loops
    // @param {undefined|jquery} el optional element
    captureGeometry: function($el) {
      $el || ($el = this.$el);
      var offset = $el.offset();
      this.set({
        width: $el.width(),
        height: $el.height(),
        x: offset.left,
        y: offset.top
      });
    },
    
    // Add a single tile
    _addTile: function(tile, index, extend) {
      tile = this._toTile(tile, extend);
      return this._attachTile(tile, index);
    },
    
    // Attach a child tile
    _attachTile: function(tile, index) {
      if (_.isUndefined(index)) {
        index = this.tiles.length;
      }
      this._attachDOM(tile, index);
      
      this.tiles.splice(index, 0, tile);
      
      tile.parent = this;
      this.childInit(tile);
      tile.parentInit(this);
      this.markChange(tile);
      
      return tile;
    },
        
    // Detach a child tile
    _detachTile: function(tile) {
      this.closeChild(tile);
      tile.unbind(this);
      tile.captureGeometry();
      tile.clearCSS();
      tile.parent = null;
      this._detachDOM(tile);
      this.tiles = _.without(this.tiles, tile);
      this.markChange();
      
      return tile;
    },

    // Attach to the DOM
    _attachDOM: function(tile, index) {
      var len = this.tiles.length;
      
      if (tile.$el[0] != this.$el[0]) {
        if (index >= len || _.isUndefined(index)) {
          this.$el.append(tile.$el);
        }
        else if (index == 0) {
          this.$el.prepend(tile.$el);
        }
        else {
          if (index < 0) index = len - index;
          this.$el.children().eq(index).before(tile.$el);
        }
      } 
    },

    // Detach from the DOM
    _detachDOM: function(tile) {
      tile.$el.detach();
    },
    
    /**
     * Ensure we have a detached instance of a tile
     * @param {Tile|tile|string|object} tile (4 types of input)
     * @param {object} extend (extend tile options / optional)
     */
    _toTile: function(tile, extend) {
      // detach instantiated tile
      if (isTile(tile)) {
        tile.detach();
        tile.set(extend);
        return tile;
      }
      // ensure tile is an object
      if (!_.isObject(tile) || _.isFunction(tile)) {
        tile = { type: tile };
      }
      // apply the default values
      if (_.isObject(extend)) {
        tile = _.extend({}, tile, extend);
      }
      // ensure tile has type
      if (!tile.type) {
        tile.type = this.type;
      } 
      var Type = this._toType(tile.type);
      return this._makeTile(Type, tile);
    },
    
    // Make a tile (override to customize)
    _makeTile: function(Type, options) {
      return (new Type(options));
    },
    
    // Convert tile type to constructor
    _toType: function(type) {
      if (_.isString(type)) {
        type = Dash.Tiles[type];
      }
      return (_.isFunction(type) ? type : Dash.Loader);
    },
    
    // Apply the default tiles to the options
    _defaultTiles: function(options) {
      if (this.defaultTiles && (!_.isObject(options) || !options.tiles)) {
        if (!_.isObject(options)) options = {};
        options.tiles = _.result(this, 'defaultTiles');
      }
      return options;
    },
    
    // ----------------------------------------------------------------------
    //    DRAG 
    // ----------------------------------------------------------------------
    
    /**
     * Make the tile draggable
     * 
     * NOTE: all this does is add a .drag class to the element
     * NOTE: manually add .drag class to any element to make draggable
     */
    setDrag: function(state) {
      this.$el.toggleClass('drag', this.drag = state);
    },
    
    /**
     * Set-up the drag operation
     * 
     * @return {true|false} (true=handle the drag, false=pass to parent}
     */
    dragInit: function(ev, dd) {
    },

    // Start the drag
    dragStart: function(ev, dd) {
    },
    
    // Move within a drag
    dragMove: function(ev, dd) {
    },
    
    // End the drag
    dragEnd: function(ev, dd) {
    },
    
    // Clean up initialization
    dragFinish: function(ev, dd) {
    },
    
    // ----------------------------------------------------------------------
    //    DROP
    // ----------------------------------------------------------------------
    
    /**
     * Enable Drop support within a tile
     */
    setDrop: function(state) {
      this.$el.toggleClass('drop', this.drop = state);
    },
    
    //  the drop-zones
    dropInit: function(ev, dd) {
      return true;
    },
    
    // Enter a drop-zone
    dropOver: function(ev, dd) {
    },
    
    // Move within a drop-zone
    dropMove: function(ev, dd) {
    },
    
    // Exit a drop-zone
    dropOut: function(ev, dd) {
    },
    
    // Commit a drop
    dropCommit: function(ev, dd) {
      return true;
    },
    
    // Finish the drop-zone
    dropFinish: function(ev, dd) {
      
    },
    
    // ----------------------------------------------------------------------
    //    OPTIONS INFRASTRUCTURE
    // ----------------------------------------------------------------------
    
    // Option Binding
    bind: function() { 
      this.options.bind.apply(this.options, arguments); 
    },
    
    // Option Un-Binding
    unbind: function(parent) {
      this.options.unbind.apply(this.options, arguments);
    },
    
    // Option Setting
    // - make sure all sub-changes are batch rendered
    set: function() {
      this.beginChange();
      this.options.set.apply(this.options, arguments);
      this.endChange();
    },
    
    // Option Getting
    get: function(name) {
      var options = this.options.get.apply(this.options, arguments);
      if (_.isUndefined(name) && _.isObject(options)) {
        options.type = this.type;
      }
      return options;
    },
    
    // General default setter
    setter: function(name, value, target) {
      if (this._change(name, value)) {
        if (target) target.markChange(this);
        this.markChange();
      }
    },
    
    // General default getter
    getter: function(name, target) {
      return this[name];
    },
    
    /**
     * Bind options to this tile 
     * 
     * @param {object} bindings (names & filters)
     */
    bindThis: function(bindings) {
      for (var key in bindings) {
        this.bind(key, {
          filter: bindings[key]
        });
      }
    },
    
    /**
     * Bind options to a child tile
     * 
     * @param {tile} tile (child tile to bind to)
     * @param {object} bindings (names & filters)
     */
    bindChild: function(tile, bindings) {
      for (var key in bindings) {
        tile.bind(key, {
          target: this,
          filter: bindings[key]
        });
      }
    },
    
    /**
     * Bind a tile
     * 
     * @param {string} name (name of tile binding)
     * @param {object} tile (tile options / default to name)
     * @param {integer} index (tile insertion index)
     */
    bindTile: function(name, tile, index) {
      return this.bind(name, {
        context: this.add(tile || name, index, this.get(name)),
        set: 'set',
        get: '_getBoundTile',
        prime: false
      });
    },
    
    /**
     * Bind a model
     * 
     * @param {string} name (name of model binding)
     * @param {object} model (model constructor)
     * @param {object} options (model options)
     */
    bindModel: function(name, model, options) {
      return this.bind(name, {
        context: this.addModel(model || name, options),
        set: 'set',
        get: 'get',
        prime: false
      });
    },
    
    _getBoundTile: function() {
      return this.options.get.apply(this.options, arguments);
    },
    
    // ----------------------------------------------------------------------
    //    MODELS
    // ----------------------------------------------------------------------
    
    /**
     * Add a model
     * 
     * @param {object} model (model constructor or instance)
     * @param {object} options (model options)
     */
    addModel: function(model, options) {
      // >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> TODO : ADD A MODEL <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
    },
    
    // ----------------------------------------------------------------------
    //    CHANGE MANAGEMENT
    // ----------------------------------------------------------------------
    
    seeChange: function(tile, type) {
return;      
      console.log(this.cid, this.type, type, '(',
        'mark:', this.mark, 
        '[' + (this.marked ? this.marked.length : '0') + ']',
        'change:', this.change, 
        '[' + (_.isArray(this.changed) ? this.changed.length : '0') + ']',
        ')'
      );
    },
    
    seeTiles: function(type, tiles) {
return;      
      console.log(type, _.reduce(tiles, function(memo, tile) { 
        return memo + " " + tile.cid; 
      }, ''));
    },
    
    /**
     * Flag begining of changes and save tile if first change
     */
    beginChange: function() {
      this._global.count++;
    },
    
    /**
     * Flag end of changes & trigger cascading-render if last change
     */
    endChange: function() {
      var changes = this._global;
      
      if (!--changes.count && !this._deferChanges(changes)) {
        var tiles = this._reduceChanges(changes);
//console.log("=========================== RENDER ============================");        
//this.seeTiles('RENDER2', this._global.tiles);        
        for (var i = 0, l = tiles.length; i < l; i++) {
          tiles[i].render();
        }
        changes.tiles = [];
      }
    },
    
    /**
     * Mark this tile for change
     * 
     * @param {tile} tile (optional child to add to marked)
     */
    markChange: function(tile) {
      var changes = this._global;
      if (!this.change++) {
        changes.tiles.push(this);
      }
      if (tile && !tile.mark++) {
        this.marked || (this.marked = []);
        this.marked.push(tile);
      }
    },
    
    /**
     * Defer a change (i.e. pruning resizer tiles)
     */
    deferChange: function(fn) {
      if (!this.defer++) {
        this._global.defered.push([fn, this]);
      }
    },
    
    /**
     * Bubble changes up the tree to find root changes
     * - Drop if child is marked or this is changed
     */
    bubble: function(tile, child) {
      if (child && (child.mark || this.change)) {
this.seeChange(tile, 'DROP');
        return;
      } 
      this._bubble(tile);
    },
    
    /**
     * Render the tile & set child styles
     * - Reflow if marked but not changed
     */
    render: function() {
      var tiles = this.isReflow() ? this.tiles : this.marked;
      for (var i = 0, l = tiles.length; i < l; i++) {
        this.renderTile(tiles[i], {
          width: this.getWidth(),
          height: this.getHeight()
        });
      }
      return this;
    },
    
    /**
     * Set the CSS on a tile & trigger a render
     */
    renderTile: function(tile, css) {
      if (!_.isUndefined(css.width)) {
        tile._change('width', css.width);
      }
      if (!_.isUndefined(css.height)) {
        tile._change('height', css.height);
      }
      tile.$el.css(css);
      tile.render();
    },
    
    /**
     * Clear the change flags : always call after render
     */
    rendered: function() {
      this.mark = 0;      
      this.marked = null;
      this.change = 0;
      this.changed = null;
      return this;
    },
    
    /**
     * Change a local property and add it to changed[]
     */
    _change: function(name, value) {
      if (!_.isEqual(this[name], value) 
          && (!this.changed || !_.has(this.changed, name))) {
          
        if (!this.changed) this.changed = {};
        this.changed[name] = this[name] = value;
        
        return true;
      }
      return false;
    },
    
    /**
     * Apply the defered changes 
     */
    _deferChanges: function(changes) {
      if (changes.defered.length) {
        this.beginChange();
        var defered = changes.defered;
        changes.defered = [];
        for (var i = 0, l = defered.length; i < l; i++) {
          var fn = defered[i];
          fn[1].defer = 0;
          fn[0].call(fn[1]);
        }
        this.endChange();
        return true;
      }
      return false;
    },
    
    /**
     * Filter array down to top-level tiles
     */
    _reduceChanges: function(changes) {
      if (changes.tiles.length > 1) {
        var tiles = changes.tiles;
        changes.tiles = [];
        for (var i = 0, l = tiles.length; i < l; i++) {
//          console.log("---------------------- BUBBLE ---------------------");
          tiles[i].bubble();
        }
      }
      return changes.tiles;
    },
    
    /**
     * Bubble if there is a parent, push if we have reached root
     */
    _bubble: function(tile) {
      if (this.parent) {
this.seeChange(tile, 'BUBBLE');        
        this.parent.bubble(tile || this, this);
      }
      else if (this._root) {
this.seeChange(tile, 'PUSH')
        this._global.tiles.push(tile || this);
      }
      else {
this.seeChange(tile, 'IGNORE');        
      }
    },
    
    // ----------------------------------------------------------------------
    //    DOM MANIPULATION
    // ----------------------------------------------------------------------
    
    // Clear the css
    clearCSS: function() {
      this.$el.removeAttr('style');
    },
    
    /**
     * Get the width of this (without tile) or a child tile
     * - Note: this measures the DOM and forces rendering
     * 
     * @param {object|boolean} tile (type for self, object for child)
     * @param {boolean|undefined} type (boolean for child)
     */
    getWidth: function(tile, outer) {
      if (_.isObject(tile)) {
        if (!tile.width) tile.width = tile.$el.width();
        return (tile.width + (outer ? this.getPad(tile).width : 0));
      }  
      if (this.width) return this.width;
      return (this.parent ? this.parent.getWidth(this, outer) : 0);
    },
    
    /**
     * Get the width of this (without tile) or a child tile
     * - Note: this measures the DOM and forces rendering
     * 
     * @param {object|boolean} tile (type for self, object for child)
     * @param {boolean|undefined} type (boolean for child)
     */
    getHeight: function(tile, outer) {
      if (_.isObject(tile)) {
        if (!tile.height) tile.height = tile.$el.height();
        return (tile.height + (outer ? this.getPad(tile).height : 0));
      }  
      if (this.height) return this.height;
      return (this.parent ? this.parent.getHeight(this, outer) : 0);
    },
    
     /**
     * Get sizing information for a child tile
     * 
     * @param {object} tile (child tile to get sizing on)
     */
    getPad: function(tile) {
      var style = tile.el.className
        , tag = tile.el.tagName
        , hash = tag + ' ' + style;
        
      this._pad || (this._pad = []);
      if (!_.has(this._pad, hash)) {
        var $el = $('<' + tag + '>')
          .addClass(style)
          .appendTo(this.$el);
        this._pad[hash] = {
          width: $el.outerWidth(true) - $el.width(),
          height: $el.outerHeight(true) - $el.height()
        }
        $el.remove();
      }
      return this._pad[hash];
    },
    
    // ----------------------------------------------------------------------
    //    MISCELANEOUS ROUTINES
    // ----------------------------------------------------------------------
    
    setClickout: function(state) {
      if (state != this._clickout) {
        if ((this._clickout = state)) {
          this._global.clickout.push(this);
        } else {
          this._global.clickout = _.without(this._global.clickout, this);
        }
      }
    },
    
    // is clicking on this tile a click-in?
    // @return {tile|null} self-or-ancestor clickout tile
    isClickIn: function() {
      var tile;
      if (this._clickout) return this;
      if (this.parent && (tile = this.parent.isClickIn())) return tile;
      if (this.spawner && (tile = this.spawner.isClickIn())) return tile;
      return null;
    },
    
    onClickout: function() {
    },
    
    // ----------------------------------------------------------------------
    //    EVENT CAPTURE - Instead of bubbling
    // ----------------------------------------------------------------------
    
    addEvent: function(obj, types, fn) {
      types = types.split(' ');
      for (var i = 0, l = types.length; i < l; i++) {
        var type = types[i];
        if (window.addEventListener) {
          obj.addEventListener(type, fn, true);
        } else if (document.attachEvent) {
          var eProp = type + fn;
          obj['e'+eProp] = fn;
          obj[eProp] = function(){ obj['e'+eProp](window.event); };
          obj.attachEvent('on'+type, obj[eProp]);
        }
      }
    },

    removeEvent: function(obj, type, event) {
      if (window.addEventListener) {
        obj.removeEventListener(type, event, true);
      } else if (document.attachEvent) {
        var eProp = type + event;
        obj.detachEvent('on'+type, obj[eProp]);
        obj[eProp] = null;
        obj["e"+eProp] = null;
      }
    }
    
  });
