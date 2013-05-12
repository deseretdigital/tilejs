  // -----------------------------------------------------------------------
  //    Reflow Constants
  // -----------------------------------------------------------------------

  // Reflow Reasons
  REFLOW_NONE = 0;      
  REFLOW_INIT = 1;        // Change Flag
  REFLOW_CHANGE = 2;      // Change Flag
  
  // Recursion Loop Detection
  REFLOW_DEPTH = 10;
  REFLOW_OVERFLOW = 10000;

  // -----------------------------------------------------------------------
  //    Reflow constructor
  // -----------------------------------------------------------------------

  Reflow = function() {
    this.count = 0;
    this.change = [];
    this.measure = [];
  };
  
  // -----------------------------------------------------------------------
  //    Start the reflow capture
  // -----------------------------------------------------------------------
  
  Reflow.prototype.capture = function() {
    this.count++;
  };

  // -----------------------------------------------------------------------
  //    Finish the reflow capture
  // -----------------------------------------------------------------------
  
  Reflow.prototype.finish = function() {
    if (!--this.count) this.dispatch();
  };

  // -----------------------------------------------------------------------
  //    Begin the dispatch process
  // -----------------------------------------------------------------------
  
  Reflow.prototype.dispatch = function(level) {
    var that = this;
    level || (level = 0);
    this.count = 0;

    if (level >= REFLOW_DEPTH) {
      console.error('Reflow.disptach() recursion error');
      console.trace();
    } 
    else {
      if (this.change.length) {
        this.dispatchChanges();
      }
      if (this.measure.length) {
        _.defer(function() { 
          that.dispatchMeasure();
        if (that.change.length) {
            that.dispatch(level + 1);
          }
        });
      }
    }
  };

  // -----------------------------------------------------------------------
  //    Dispatch the change queue
  // -----------------------------------------------------------------------
  
  Reflow.prototype.dispatchChanges = function() {
    var view, count = 0;
    
    while ((view = this.change.shift())) {
      if (view._change) {
        view.onChanges();
        view._change = 0;
        if (count++ > REFLOW_OVERFLOW) {
          console.error('Reflow.change queue overflow');
          console.trace();
        }
      }
    }
    this.change = [];
  };

  // -----------------------------------------------------------------------
  //    Dispatch the measure queue
  // -----------------------------------------------------------------------
  
  Reflow.prototype.dispatchMeasure = function() {
    var view, count = 0;
    
    while ((view = this.measure.shift())) {
      if (view._measure) {
        view.onMeasure();
        view._measure = 0;
        if (count++ > REFLOW_OVERFLOW) {
          console.error('Reflow.measure queue overflow');
          console.trace();
        }
      }
    }
    this.measure = [];
  };
