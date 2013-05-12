    
  // ------------------------------------------------------------------------
  //    GLOBAL HELPERS
  // ------------------------------------------------------------------------
  
  var 
  
    Dash = window.Dash = { 
      Tiles: {},
      root: null,
      Loader: null,
      Error: null,
      Dragger: null
    },
  
    // Abreviated System Helpers
    abs = Math.abs,
    round	= Math.round,
    floor = Math.floor,
    slice = Array.prototype.slice,
    
    // Constants
    BIG = 100000,
    
    // Turn a name value pair into an object
    toObj = function(name, value) {
      if (_.isObject(name)) return name;
      var obj = {};
      if (name) obj[name] = value;
      return obj;
    },
    
    // Test to see if something is a tile
    isTile = function(tile) {
      return (tile instanceof Tile);
    },
    
    // Test to see if something is a jquery object
    isJQuery = function(obj) {
      return (obj instanceof jQuery);
    },
    
    // Test to see if something is empty
    isNone = function(value) {
      if (_.isUndefined(value)) return true;
      if (_.isNumber(value) && !value) return true;
      if (_.isArray(value) && !value.length) return true;
      if (_.isObject(value) && _.isEmpty(value)) return true;
      return false;
    },
    
    stopEvent = function(ev) {
      ev.cancelBubble = true;
      if (ev.stopPropagation) ev.stopPropagation();
    },
    
    // Disable text select
    textSelection = function(bool) { 
      $(document)[bool ? "unbind" : "bind"]("selectstart", function() { 
        return false; 
        }).css("MozUserSelect", bool ? "" : "none");
      document.unselectable = bool ? "off" : "on"; 
    },
    
    // Convert titles to class names
    classify = function(str) {
      str || (str = '');
      return str.replace(/_/g, ' ').replace(/(?:^|\s)\S/g, function(c) { 
        return c.toUpperCase(); 
      }).replace(/\s/g, '');
    };
    