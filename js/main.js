requirejs.config({
  
  // ---------- REQUIRE PATHS ----------
  paths: {
    dash: 'lib/dash/tiles',
    app: 'app/tiles',
    
    // Require.js plugin
    tile: 'lib/dash/require/tile',
    Dash: 'lib/dash/dash',
    
    // Base Libraries
    jQuery: 'lib/jquery/jquery-1.9.1.min',
    Underscore: 'lib/underscore/underscore.1.4.4',
    Backbone: 'lib/backbone/backbone.1.0.0'
  },
  
  // ---------- REQUIRE SHIMS ----------
  shim: {
    jQuery: {
      exports: 'jQuery'
    },
    Underscore: {
      exports: '_'
    },
    Backbone: {
      deps: ['Underscore', 'jQuery'],
      exports: 'Backbone'
    }
  }
});

// --------------------------------------------------------------------------
//    MAIN FUNCTION
// --------------------------------------------------------------------------

requirejs([
  'Dash',
  'tile!dash/root',
  'tile!dash/positioner',
  'tile!dash/resizer',
  'tile!dash/slider',
  'tile!dash/spacer',
  'tile!dash/stacker',
  'tile!dash/header',
  'tile!dash/menu',
  'tile!dash/test',
  'tile!dash/widget'
  ], function(Dash, Root) {
  
    Dash.root = new Root();
  
    Dash.root.addTile([{ 
      type: 'dash/stacker',
      axis: 'vertical',
      position: 'screen',
      tiles: [
        { type: 'app/navbar', label: 'Backbone-Dash2' },
        { type: 'dash/resizer',
          name: 'body',
          tiles: [
            { tiles: [ 
              { type: 'dash/widget' }, 
              { tiles: [ 
                { type: 'dash/widget' },
                { type: 'dash/widget' },
                { type: 'dash/widget' },
              ]}, 
              { type: 'dash/widget' }, 
            ]},
            { tiles: [
              { type: 'dash/widget' }, 
              { tiles: [
                { type: 'dash/widget' }, 
                { type: 'dash/widget' },
              ]}, 
              { type: 'dash/test2' }, 
              { type: 'dash/test2' },
              { type: 'dash/test2' }
            ]}
        ]}
      ]
    }]);
    
  }
);