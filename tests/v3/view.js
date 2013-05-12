  // -----------------------------------------------------------------------
  //    View Object
  // -----------------------------------------------------------------------

  View = Backbone.View.extend({

    // Style Parameters
    style: new Style(),         // Global style object
    _styleHash: null,           // Style hash
    _styleSize: null,           // Style size { width, height }

    // Reflow Parameters
    reflow: new Reflow(),       // Global reflow object
    content: REFLOW_NONE,       // Content event flags
    measure: REFLOW_NONE,       // Measure event flags

    // Relationships
    parent: null,               // Parent view
    views: null,                // Children views

    // -----------------------------------------------------------------------
    //    Backbone Overrides
    // -----------------------------------------------------------------------

    // Backbone override for deep initialization
    _configure: function() {
      Backbone.View.prototype._configure.apply(this, arguments);
      this.views = [];
    },

    // Backbone override for faster element creation
    _ensureElement: function() {
      if (!this.el) {
        this.el = document.createElement(this.tagName);
      } 
      this.el.className = this.className;
      this.setElement(this.el, false);
    },
    
    // -----------------------------------------------------------------------
    //    Relationship Management
    // -----------------------------------------------------------------------

    // Add a child view
    addView: function(view) {
      view.parent = this;
      this.views.push(view);
      this.el.appendChild(view.el);
      view.flagMeasure();
    },
    
    // -----------------------------------------------------------------------
    //    Reflow Management
    // -----------------------------------------------------------------------

    // Flag a content reflow
    flagContent: function(flags) {
      if (!this.content) {
        this.reflow.content.push(this);
      }
      this.content |= flags;
    },
    
    // Content reflow event
    onContent: function() {
      var size = this.styleSize();
      if (size) {
        // styling... do something!!!
      } else {
        // no styling... defer???
      }
    },
    
    // Flag for measurement
    flagMeasure: function() {
      if (!this.measure++) {
        this._styleSize = this._styleHash = null;
        this.reflow.measure.push(this);
        for (var i = 0, l = this.views.length; i < l; i++) {
          this.views[i].flagMeasure();
        }
      }
    },
    
    // Measure reflow event
    onMeasure: function() {
      var size = this.styleSize();
      if (!size) {
        
      } 
    },
    
    // -----------------------------------------------------------------------
    //    DOM Management
    // -----------------------------------------------------------------------
    
    clearStyle: function() {
      this.$el.removeAttr('style');
    },
    
    // get the style size
    // @force {boolean} true to force sizing
    styleSize: function(force) {
      if (!this._styleSize) {
        var hash = this.styleHash();
        this._styleSize = this.style.size(hash, force ? this.el : null);
        if (this._styleSize && this.measure) {
          this.measure = REFLOW_NONE;
        }
      }
      return this._styleSize;
    },
    
    // get the style hash
    styleHash: function() {
      if (!this._styleHash) {
        this._styleHash = 
          (this.parent ? this.parent.styleHash() : '')
          + '/' + this.tagName 
          + ':' + this.className;
      }
      return this._styleHash;
    }

  });
