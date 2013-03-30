#!/usr/bin/php -q
<?php

define('BASE_PATH', dirname(__FILE__) . '/');

$dash = fopen(BASE_PATH . "dash.js", "w");

fwrite($dash, "define(['jQuery', 'Underscore', 'Backbone'],\n");
fwrite($dash, "  function($, _, Backbone) {\n");

fwrite($dash, file_get_contents(BASE_PATH . "src/globals.js"));
fwrite($dash, file_get_contents(BASE_PATH . "src/dragdrop.js"));
fwrite($dash, file_get_contents(BASE_PATH . "src/options.js"));
fwrite($dash, file_get_contents(BASE_PATH . "src/tile.js"));
fwrite($dash, file_get_contents(BASE_PATH . "src/dragger.tile.js"));
fwrite($dash, file_get_contents(BASE_PATH . "src/loader.tile.js"));
fwrite($dash, file_get_contents(BASE_PATH . "src/error.tile.js"));

fwrite($dash, "\n\nreturn Dash;");
fwrite($dash, "\n\n});");

fclose($dash);
