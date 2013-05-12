  // -----------------------------------------------------------------------
  //    Reflow Object
  // -----------------------------------------------------------------------

  // Reflow Reasons
  REFLOW_NONE = 0;      
  REFLOW_INIT = 1;        // Content Flag
  REFLOW_CONTENT = 2;     // Content Flag
  
  // Infinite Recursion Detection
  REFLOW_DEPTH = 10;
  REFLOW_OVERFLOW = 10000;

  // Reflow constructor
  Reflow = function() {
    this.count = 0;
    this.content = [];
    this.measure = [];
  };

  // Start the reflow capture
  Reflow.prototype.capture = function() {
    this.count++;
  };

  // Finish the reflow capture
  Reflow.prototype.finish = function() {
    if (!--this.count) this.dispatch();
  };

  // Begin the dispatch process
  Reflow.prototype.dispatch = function(level) {
    var that = this;
    level || (level = 0);
    this.count = 0;

    if (level >= REFLOW_DEPTH) {
      console.error('Reflow disptach recursion error');
      console.trace();
    } 
    else {
      if (this.content.length) {
        this.dispatchContent();
      }
      if (this.measure.length) {
        _.defer(function() { 
          that.dispatchMeasure();
        if (that.content.length) {
            that.dispatch(level + 1);
          }
        });
      }
    }
  };

  // Dispatch the content queue
  Reflow.prototype.dispatchContent = function() {
    var view, count = 0;
    
    while ((view = this.content.shift())) {
      if (view.content) {
        view.onContent();
        view.content = 0;
        if (count++ > REFLOW_OVERFLOW) {
          console.error('Reflow content queue overflow');
          console.trace();
        }
      }
    }
    this.content = [];
  };

  // Dispatch the measure queue
  Reflow.prototype.dispatchMeasure = function() {
    var view, count = 0;
    
    while ((view = this.measure.shift())) {
      if (view.measure) {
        view.onMeasure();
        view.measure = 0;
        if (count++ > REFLOW_OVERFLOW) {
          console.error('Reflow measure queue overflow');
          console.trace();
        }
      }
    }
    this.measure = [];
  };
