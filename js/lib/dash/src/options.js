  
  // ------------------------------------------------------------------------
  //    OPTIONS OBJECT
  // ------------------------------------------------------------------------
  
  /**
   * Option constructor
   *
   * @param {object} options (initial buffer options)
   * @param {object} context (global default context)
   */
  var Options = Dash.Options = function(options, context) {
    this.context = context;
    this.schema = {};    
    this.buffer = toObj(options);
  };
  
  Options.prototype = {
    
    /**
     * Close options and prevent memory leaks
     */
    close: function() {
      delete this.context;
      delete this.schema;
      delete this.buffer;
    },
    
    /**
     * Add an option binding
     * 
     * @param {string|array} name (option name(s))
     * @param {object} params
     * 
     *    context: {object} (calling context of setter & getter)
     *    
     *    set: {fn|string} (set - default setName or set)
     *    get: {fn|string} (get - default getName or get)
     *    
     *    target: {object} (passed in after name & value if set)
     *    name: {boolean} (pass name with the value on set/get)
     *    
     *    prime: {boolean} (set after binding - default true)
     *    keep: {boolean} (keep data from last binding - default true)
     *    
     *    filter: {*} (filter incoming and outgoing values)
     */
    bind: function(name, params) {
      
      // iterate through multiple bindings
      var names = this._toNames(name);
      for (var i = 0, l = names.length; i < l; i++) {
        var key = names[i];
        
        // passthru, unbind and bind
        var obj = this._bind(key, toObj(params));
        this._unbind(key, obj.keep);
        this.schema[key] = obj;
        
        // prime the binding
        if (obj.prime) {
          this._set(key, this.buffer[key]);
        }
      }
      return obj.target;
    },
    
    /**
     * Remove an option binding
     * 
     * @param {string} name (remove by name(s))
     * @param {array} name (remove by names)
     * @param {object} name (remove by target object)
     * @param {undefined} name (remove all)
     * @param {boolean} buffer (save to buffer before removing)
     */
    unbind: function(name, buffer) {
      var i, l, key, names, obj;
      
      // Unbind by name(s) as string or array of strings
      if (_.isString(name) || (_.isArray(name))) {
        names = this._toNames(name);
        for (i = 0, l = names.length; i < l; i++) {
          this._unbind(names[i], buffer);
        }
      }  
      // Unbind by target or context object
      else if (_.isObject(name)) {
        names = _.keys(this.schema);
        for (i = 0, l = names.length; i < l; i++) {
          key = names[i];
          obj = this.schema[key];
          if (obj.target == name || obj.context == name) { 
            this._unbind(key, buffer);
          }
        }
      }
      // Unbind everything
      else {
        if (buffer) this.buffer = this.get();
        this.schema = {};
      }
    },
      
    /**
     * Set an option value(s)
     *
     * @param {string} name (set a single name-value pair)
     * @param {object} name (set a group of name-value pairs)
     * @param {*} value (value when name is a string)
     */
    set: function(name, value) {
      
      // set by name & value
      if (_.isString(name)) {
        this._set(name, value);
      }
      // set by object
      else if (_.isObject(name)) {
        for (var key in name) {
          this._set(key, name[key]);
        }
      }
    },
    
    /**
     * Get an option value(s)
     * 
     * @param {string} name (get a single name-value pair)
     * @param {object} name (get a group of name-value pairs)
     */
    get: function(name) {
      
      // get option by name
      if (_.isString(name)) {
        return this._get(name);
      } 
      // (or) get all options
      if (!_.isObject(name)) {
        name = this.schema;
      }
      // extend object with options
      var out = {};
      for (var key in name) {
        var value = this._get(key);
        if (!isNone(value)) out[key] = value;
      }
      return out;
    },
    
    // prepare the bind settings and set defaults
    _bind: function(key, obj) {
      var context = _.isObject(obj.context) ? obj.context : this.context;
      return {
        context: context,
        set: this._toFn('set', key, obj.set, obj.name, obj.target, context),
        get: this._toFn('get', key, obj.get, obj.name, obj.target, context),
        keep: _.isUndefined(obj.keep) ? true : obj.keep,
        prime: _.isUndefined(obj.prime) ? true : obj.prime,
        target: obj.target,
        filter: obj.filter
      }
    },
    
    /**
     * Create the setter and getter closure
     */ 
    _toFn: function(type, key, fn, name, target, context) {
      var params = [], index, alt;
      
      if (!fn) fn = type + classify(key);
      if (_.isString(fn)) fn = context[fn];
      if (!_.isFunction(fn)) {
        alt = type + (context == this.context ? 'ter' : '');
        if (!_.isFunction(fn = context[alt])) {
          key = "Invalid " + alt + " " + key;
          return this._getFn(type, key, this._error, 1, 0, this);
        }
      }
      if (name || alt) params.push(key);
      if (type == 'set') index = params.push(null);
      if (target) params.push(target);
      
      return function(value) {
        if (index) params[index - 1] = value;
        //console.log(index?'SET':'GET',alt,params);
        return fn.apply(context, params);
      };
    },
    
    // Set an option value
    _set: function(name, value) {
      var option = this.schema[name];
      if (!option) this.buffer[name] = value;
      else if (option.setLoop) {
        this._error("Set loop on " + name);
      } else {  
        option.setLoop = true; 
        option.set(this._setFilter(value, option.filter));
        option.setLoop = false;
      } 
    },
    
    // Get an option value
    _get: function(name) {
      var option = this.schema[name], value;
      if (!option) return this.buffer[name];
      else if (option.getLoop) {
        this._error("GET loop on " + name);
      } else {
        option.getLoop = true;
        value = option.get();
        option.getLoop = false;
      }
      return this._getFilter(value, option.filter);  
    },
    
    // Log an error message
    _error: function(message) {
      console.log(this.context.cid, "WARNING", message, this);
    },
    
     // Unbind a named option
    _unbind: function(name, buffer) {
      if (this.schema[name]) {
        if (buffer) this.buffer[name] = this.get(name);
        delete this.schema[name];
      }
    },
    
    // Convert name to names
    _toNames: function(name) {
      if (_.isString(name)) return name.split(' ');
      if (_.isArray(name)) return name;
      return [];
    },
    
    /**
     * Filter an option to be set
     * 
     * @value {*} value (option value)
     * @filter {undefined} filter (no filter)
     * @filter {boolean} filter (boolean with default)
     * @filter {string} filter (string with default)
     * @filter {number} filter (number with default)
     * @filter {array} filter (enum-string with default)
     * @filter {object} filter (named enum with default)
     */
    _setFilter: function(value, filter) {
      var blank = _.isUndefined(value);
      if (_.isUndefined(filter)) {
        return value;
      } else if (_.isBoolean(filter)) {
        return (blank ? filter : value ? true : false);
      } else if (_.isString(filter)) {
        return (blank ? filter : ('' + value));
      } else if (_.isNumber(filter)) {
        if (_.isNumber(value)) return value;
        if (_.isString(value)) return parseInt(value, 10);
        return filter;
      } else if (_.isArray(filter)) {
        if (!blank) {
          value = ('' + value).toLowerCase();
          if (_.indexOf(filter, value) >= 0) return value;
        }
        return _.first(filter);
      } else if (_.isObject(filter)) {
        if (!blank) {
          value = filter[('' + value).toLowerCase()];
          if (!_.isUndefined(value)) return value;
        }
        return _.first(_.values(filter));
      } 
      return value;
    },
    
    // Convert internal option to output value
    _getFilter: function(value, filter) {
      if (_.isUndefined(filter)) {
        return value;
      } else if (_.isBoolean(filter)) {
        if (value != filter) return value;
      } else if (_.isString(filter)) {
        if (value != filter) return value;
      } else if (_.isNumber(filter)) {
        if (value != filter) return value;
      } else if (_.isArray(filter)) {
        if (value != _.first(filter)) return value;
      } else if (_.isObject(filter)) {
        var i = 0;
        for (var name in filter) {
          if (filter[name] != value) i++;
          else return (i ? name : undefined);
        }
      } 
      return undefined;
    }
  };