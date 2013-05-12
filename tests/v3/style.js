  // -----------------------------------------------------------------------
  //    DOM Object
  // -----------------------------------------------------------------------

  // Reflow constructor
  Style = function() {
    this.cache = {};
  };

  // get the sizing for a hash
  // @el {dom_element} (optional) to force sizing
  Style.prototype.size = function(hash, el) {
    var size = this.cache[hash];
    if (!size && el) {
      size = this.cache[hash] = this.pad(el);
    }
    return size;
  };
  
  // Find a style in the hash
  Style.prototype.pad = function(el) {
    var style = document.defaultView.getComputedStyle(el, '');
    return {
      width: this.side(style, 'left') + this.side(style, 'right'),
      height: this.side(style, 'top') + this.side(style, 'bottom')
    }
  };

  // Measure of a side
  Style.prototype.side = function(style, side) {
    return this.prop(style, 'margin-' + side)
    + this.prop(style, 'padding-' + side)
    + this.prop(style, 'border-' + side);
  };
    
  // Convert measurement to integer
  Style.prototype.prop = function(style, name) {
    return parseInt(style.getPropertyValue(name, 10));
  };