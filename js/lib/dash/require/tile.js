define(['Dash'], function(Dash) {
  
  /**
   * Throw an error
   */
  function error(onload, err) {
    onload.error(err);
    console.log("Error Loading Tile", err.type);
  }
  
  /**
   * Return the plugin object
   */
  return {
    load: function(name, req, onload, config) {
      
      var path = name + '.tile';
      
      // Use require to load the tile
      req([path], function(Tile) {

        // Add the tile to the global tile registry
        Dash.Tiles[name] = Tile;

        // Add the normalized name to the tile as .type
        Tile.prototype.type = name;

        // Return the tile as the loaded value
        onload(Tile);

      // There was an error loading the tile...
      }, function(err) {

        // Return an error object
        error(onload, {
          type: err.requireType,
          name: name,
          path: path
        });

      });
    }
  };
  
});