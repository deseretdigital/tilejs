  // -----------------------------------------------------------------------
  //    Reflow constructor
  // -----------------------------------------------------------------------
  
  Style = function() {
    this.cache = {};
  };

  // -----------------------------------------------------------------------
  //    Get the sizing for a hash
  //    @el {dom_element} (optional) to force sizing
  // -----------------------------------------------------------------------
  
  Style.prototype.size = function(hash, el) {
    var size = this.cache[hash];
    if (!size && el) {
      size = this.cache[hash] = this.pad(el);
    }
    return size;
  };
  
  // -----------------------------------------------------------------------
  //    Reset the style cache
  // -----------------------------------------------------------------------
  
  Style.prototype.reset = function() {  
    this.cache = {};
  };

  // -----------------------------------------------------------------------
  //    Get the measure of width x height
  // -----------------------------------------------------------------------
  
  Style.prototype.pad = function(el) {
    var style = document.defaultView.getComputedStyle(el, '');
    return {
      width: this.side(style, 'left') + this.side(style, 'right'),
      height: this.side(style, 'top') + this.side(style, 'bottom')
    }
  };

  // -----------------------------------------------------------------------
  //    Get the measure of the of one side
  // -----------------------------------------------------------------------
  
  Style.prototype.side = function(style, side) {
    return this.property(style, 'margin-' + side)
    + this.property(style, 'padding-' + side)
    + this.property(style, 'border-' + side);
  };

  // -----------------------------------------------------------------------
  //    Get the measure of one property
  // -----------------------------------------------------------------------
  
  Style.prototype.property = function(style, name) {
    return parseInt(style.getPropertyValue(name, 10));
  };