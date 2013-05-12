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
    _change: 0,                 // Reflow change flag
    _measure: 0,                // Reflow measure flags

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
      this.initChild(view);
      view.initParent(this);
    },
    
    // initialize the child
    initChild: function(view) {
      this.views.push(view);
      this.el.appendChild(view.el);
    },
    
    // initialize the parent
    initParent: function(view) {
      this.parent = view;
      this.measure();
    },
    
    // -----------------------------------------------------------------------
    //    Layout Management
    // -----------------------------------------------------------------------
    
    layout: function() {
      
    },
    
    // -----------------------------------------------------------------------
    //    Reflow Management
    // -----------------------------------------------------------------------

    // Flag a change reflow
    change: function() {
      if (!this._change++) {
        this.reflow.change.push(this);
      }
    },
    
    // Changes reflow event
    onChange: function() {
      var size = this.styleSize();
      if (size) {
        this.bubble();
        //console.log("sizing_ok", this.className + '(' + size.width + 'x' + size.height + ')');
        // styling... do something!!!
      } else {
        console.log("sizing_err");
      }
    },
    
    bubble: function(views) {
      if (this.parent) {
        if (views) views.push(this);
        else views = [this];
        this.parent.bubble(views);
      } else {
        
      }
    },
    
    // Flag for measurement
    measure: function() {
      if (!this._measure++) {
        this._styleSize = this._styleHash = null;
        this.reflow.measure.push(this);
        for (var i = 0, l = this.views.length; i < l; i++) {
          this.views[i].measure();
        }
      }
    },
    
    // Measure reflow event
    onMeasure: function() {
      this._styleSize = this.styleSize(this.el);
      this.change();
    },
    
    // -----------------------------------------------------------------------
    //    DOM Management
    // -----------------------------------------------------------------------
    
    clearStyle: function() {
      this.$el.removeAttr('style');
      //this.el.removeAttribute('style');
    },
    
    // get the style size
    // @el {dom_element} (optional) forces sizing if not cached
    styleSize: function(el) {
      if (!this._styleSize) {
        var hash = this.styleHash();
        this._styleSize = this.style.size(hash, el);
        if (this._styleSize && this._measure) {
          this._measure = 0;
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
