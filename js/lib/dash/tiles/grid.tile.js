define(['jQuery', 'Underscore', 'Backbone', 'Dash'], 
  function($, _, Backbone, Dash) {
    
  // ------------------------------------------------------------------------
  //    TILE : GRID
  // ------------------------------------------------------------------------
  
  return Dash.Tile.extend({
    
    className: 'tile grid',
    
    rows: null,
    _gridChange: 0,
    
    // Initialize
    initialize: function() {
      
      Tile.prototype.initialize.apply(this, arguments);

      var columns = [
        { name: 'one', width: 100 },
        { name: 'two', width: 80 },
        { name: 'three', width: 150 },
        { name: 'four', width: 50 },
        { name: 'five', width: 200 },
        { name: 'six', width: 50 },
        { name: 'seven', width: 300 }
      ];
      var table = this.generateData(columns, 70);

      this.elementsInit();

      this.columnsInit(columns);
      this.tableInit(table);
      
      this.sizeColumns();
      
      this.cursorInit();
      this.keysInit('right,left,up,down,enter,escape');
    },
    
    elementsInit: function() {
      this.$head = $('<div class="grid-head" />');
      this.$hTable = $('<table />').appendTo(this.$head);
      this.$hBody = $('<tbody />').appendTo(this.$hTable);
      this.$hRow = $('<tr />').appendTo(this.$hBody);
      this.$head.appendTo(this.$el);

      this.$body = $('<div class="grid-body" />');
      this.$bTable = $('<table />').appendTo(this.$body);
      this.$bHead = $('<thead />').appendTo(this.$bTable);
      this.$bRow = $('<tr />').appendTo(this.$bHead);
      this.$bBody = $('<tbody />').appendTo(this.$bTable);
      this.$body.appendTo(this.$el);
    },
    
    events: {
      'mousedown': 'onMouseDown'
    },
    
    // -----------------------------------------------------------------------
    //  COLUMNS
    // -----------------------------------------------------------------------
    
    columnsInit: function(columns) {
      this.columns = new Backbone.Collection();
      this.columns.on('reset', this.onColumnsReset, this);
      this.columns.reset(columns);
    },
    
    onColumnsReset: function() {
      var that = this;

      this.$hCols = null;
      this.$bCols = null;
      this.columns.each(function(column) {
        
        var name = column.get('name');
        var width = column.get('width');
        var $col = $('<td>' + name + '</td>').width(width);
        if (!that.$hCols) that.$hCols = $col;
        $col.appendTo(that.$hRow);
        
        $col = $('<td />').width(width);
        if (!that.$bCols) that.$bCols = $col;
        $col.appendTo(that.$bRow);
      });
    },
    
    sizeColumns: function() {
      var that = this
        , $hCol = this.$hCols
        , $bCol = this.$bCols;
        
      this.columns.each(function(col) {
        var width = col.get('width');
        $hCol.width(width);
        $bCol.width(width);
        $hCol = $hCol.next();
        $bCol = $bCol.next();
      });
    },
    
    // -----------------------------------------------------------------------
    //  TABLE
    // -----------------------------------------------------------------------
    
    tableInit: function(rows) {
      this.table = new Backbone.Collection();
      this.table.on('reset', this.onTableReset, this);
      this.table.on('add', this.onRowAdd, this);
      this.table.on('remove', this.onRowRemove, this);
      this.table.reset(rows);
    },
    
    onTableReset: function() {
      var that = this;
      this.rows = [];

      this.$bBody.empty();
      this.table.each(function(model) {
        var view = new GridRow({ 
            model: model,
            columns: that.columns
          });
        view.render().$el.appendTo(that.$bBody);          
        that.rows.push(view);          
      });
    },
    
    onRowAdd: function() {
      
    },
    
    onRowRemove: function() {
      
    },
    
    // -----------------------------------------------------------------------
    //  CURSOR
    // -----------------------------------------------------------------------
    
    cursorInit: function() {
      this.$cursor = $('<div class="cursor">&nbsp;</div>');
      this.cursorView = null;
      this.cursorCell = null;
      this.cursorX = 0;
      this.cursorY = 0;
      this.setCursor();
    },
    
    setCursor: function(x, y) {
      if (!x || x < 0) x = 0;
      if (!y || y < 0) y = 0;
      
      if (y >= this.table.length) y = this.table.length - 1;
      if (x >= this.columns.length) x = this.columns.length - 1;
      
      if (!this.cursorCell || x != this.cursorX || y != this.cursorY) {
        this.cursorX = x;
        this.cursorY = y;
        if (this.cursorCell) this.$cursor.detach();
        this.cursorView = this.rows[this.cursorY];
        this.cursorCell = this.cursorView.$el.children('td').eq(this.cursorX);
        this.$cursor.prependTo(this.cursorCell);
        this.scrollToCursor(this.$body, this.cursorCell);
      }
    },
    
    // Scroll to cursor
    scrollToCursor: function(window, cursor) {
      if ((!window) || (!window.length)) return;
      if ((!cursor) || (!cursor.length)) return;

      var curOffset = cursor.position().top;
      var curHeight = cursor.outerHeight();
      var winOffset = window.scrollTop();
      var winHeight = window.height();
      var curPosition = winOffset + curOffset;
      
      if (curOffset < 0) {
        window.scrollTop(curPosition);
      } else if ((curOffset + curHeight) >= winHeight) {
        window.scrollTop(curPosition - winHeight + curHeight);
      }
    },
    
    editCursor: function() {
      if (this.cursorView) {
        var model = this.cursorView.model;
        var column = this.columns.at(this.cursorX);
        console.log("EDIT",model.cid,column.cid);
      }
    },
    
    // -----------------------------------------------------------------------
    //  MOUSE
    // -----------------------------------------------------------------------
    
    onMouseDown: function(ev) {
      var $cell = $(ev.target);
      var y = $cell.closest('tr').index();
      var x = $cell.index();
      this.setCursor(x, y);
    },
    
    // -----------------------------------------------------------------------
    //  KEYS
    // -----------------------------------------------------------------------
    
    keysInit: function(keys) {
      keys = keys.split(',');
      for (var i = 0, l = keys.length; i < l; i++) {
        var key = keys[i];
        var fn = 'key' + classify(key);
        if (fn in this) {
          window.jsKeys.addShortcut({
            el: this.$el,
            shortcut: key,
            callback: this[fn],
            cbContext: this
          });
        }
      }
      window.jsKeys.setContext(this.$el);      
    },
    
    keyRight: function() {
      this.setCursor(this.cursorX + 1, this.cursorY);
    },
    
    keyLeft: function() {
      this.setCursor(this.cursorX - 1, this.cursorY);
    },
    
    keyUp: function() {
      this.setCursor(this.cursorX, this.cursorY - 1);
    },
    
    keyDown: function() {
      this.setCursor(this.cursorX, this.cursorY + 1);
    },
    
    keyEnter: function() {
      this.editCursor();
    },
    
    keyEscape: function() {
      console.log("ESCAPE");
    },
    
    // -----------------------------------------------------------------------
    //  
    // -----------------------------------------------------------------------
    
    // Trigger post-rendering updates
    gridChange: function(status) {
      if (status) this._gridChange++;
      else if (!--this._gridChange) {
        //this.measureRows();
      }
    },
    /*
    measureRows: function() {
      var that = this;
      _.defer(function() {
        that.table.each(function(row) {
          row.trigger('measure', row);
        });
      });
    },
    */
    // Render
    render: function() {
      var that = this;
      /*
      _.defer(function() {
        that.sizeColumns();
      });
      */
      return this;
    },
    
    // Format Cell
    formatter: function(cell) {
      
    },
    
    // Edit Cell
    editor: function(cell) {
      
    },
    
    // Generate filler data
    generateData: function(columns, size) {
      var datum = [];
      for (var i = 0, row; i < size; i++) {
        row = {};
        for (var c = 0, l = columns.length; c < l; c++) {
          var column = columns[c];
          row[column.name] = 'Value ' + column.name + ' ' + i;
        }
        datum.push(row);
      }
      return datum;
    }
    
  });
  
  // -----------------------------------------------------------------------
  //    GRID ROW VIEW
  // -----------------------------------------------------------------------
  
  var GridRow = Backbone.View.extend({
  
    tagName: 'tr',
  
    initialize: function(options) {
      this.columns = options.columns;
      this.model.on('change', this.onChange, this);
      this.$el.attr('id', this.cid);
      this.$el.data('view', this);
    },
    
    render: function() {
      var that = this;
      this.columns.each(function(col, index) {
        var name = col.get('name');
        var value = that.model.get(name);
        that.$el.append('<td class="c' + index + '">' + value + '</td>');
      });
      //this.measure();
      return this;
    },
    
    onChange: function() {
      this.$el.empty();
      var that = this;
      this.columns.each(function(col) {
        var name = col.get('name');
        var value = that.model.get(name);
        that.$el.append('<td>' + value + '</td>');
      });
      //this.measure();
    },
    
    measure: function() {
      var that = this;
      if (!this._measure) {
        this._measure = true;
        _.defer(function() {
          that._measure = false;
          that.model.height = that.$el.outerHeight(true);
        });
      }
    }
    
  });
  
});