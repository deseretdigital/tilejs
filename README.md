tilejs
======

Javascript dom manipulation for dashboards, tiles or whatever you can dream

NOTES:

	General Philosophy

 	All UI elements within the dash are to be derived from the base Tile object, which is an extension of a Backbone.View. This core object is designed to provide a minimal 
	set of services that augment, not modify, the behavior of a standard vanilla Backbone.View. I've gone to great lengths to ensure that the methods, properties 
	and behaviors of Backbone.View have been preserved without any noticible functional modification. The services provided by a Tile are designed to add-to, not modify, the
	core behaviors of a View. 

	A Tile provides four primitive discrete services that augment the standard behavior of a Backbone.View:

		1. Change Managment: Ordering the render sequence.
		2. Nesting Management: Handling the parent-child relationships.
		3. Options Managment: Serialization of nested configuration options.
		4. Drag Management: Drag & Drop as a core built-in service.

	Nesting & Geometry
	
	Tiles are designed to be nested, hence there is an implicit causal relationship between the geometric properties of a parent and child.  The bounding box 
	(containing element) of a nested Tile can't be changed without affecting it's parent and sibling content. Consequently, when a Tile changes
	it's geometry, it's parent needs to be notified and it's siblings need to typically respond with their own geometry changes. Because of the inherent geometric
	relationship between a tile, it's parent and siblings, I decided to give the parent the responsibility of managing the size and position of it's children. So even
	though the geometric properties like with, height, x and y offsets are stored within the tile, the parent is ultimately responsible for changes and is the one
	to set the properties in the DOM for the child. This means that all the sizing and positioning logic for a tile is contained within it's parent, and changing
	the parent of a child tile changes the sizing and positioning of the tile.

	A Tile is not responsible for it's own geometry.  The sizing and positioning of a tile is ALWAYS to be handled by its parent. By delegating the sizing and 
	positioning of a tile to it's parent, I was able to get away from the incredibly messy and complex code found in the old dash where
	the base tile class had to be wired to account for all possible sizing and positioning algorithms. Having to provide every possible position and sizing algorithm in 
	the base class is a terrible thing, and is the antithesis of a simple, minimal base class that delegates specialized behavior to subclasses. By simply delegating
	the responsibility of the sizing and positioning of a tile to it's parent, the tile base class has become very simple, and specialized layout mechanics are now
	isolated to specific parent tiles that now act as layout engines.  If we want a new type of layout, we don't need to burden the base tile class with extra logic, 
	we can simply create a new tile subclass that will act as a new layout for any children bound to it.

	Layout Tiles

	I have created several Tile subclasses specifically as layout engines.  They are as follows:

		1. Positioner: All children are absolutely positioned and can be set to follow one of the following positioning modes:

			a. position = 'screen'.  The child takes the size of the parent and is positioned to completely cover the parent. Because it's absolutely positioned,
						 multiple screen children can be layered on top of each other. Typically, only one child should be set to screen the parent.

			b. position = 'offset'.  The child is sized by setting the width and height property, which if set to an integer value will fix the size of the tile. 
						 If either one is set to 'auto', then the size will be determined by the content within the tile (Fluid Size). The position of
						 the tile on the page is determined by the value of the x & y offset, which is relative to one of the four corners of the
						 parent. You specify the corner by changing the value of the anchor parameter to either tl, tr, bl or br.  These stand for 
						 top-left, top-right, bottom-left and bottom-right respectively. This mode is what I use when a tile is in drag mode.

			c. position = 'center'.  The child is sized the same way as 'offset', but is always vertically and horizontally centered within the parent.  This is
						 true whether the child is fixed or fluid in size.

			d. position = 'dock'.    The child is sized the same way as 'offset', but is anchored to one of the sides of the parent tile.  I haven't implemented
						 this mode yet, so it won't work right now.

			e. position = 'target'.	 The child is sized the same way as 'offset', but is positioned relative to a target DOM element within the page. You specify
						 the element via the target parameter, and can specify an x & y value to offset the tile away from the target.  Where the tile 
						 is positioned relative to the target element depends on the values of the anchor and axis parameters.  The anchor determines
						 which corner of the tile is used to position it against the target. The value of 'tl' will position the top-left corner of the
						 tile to either the bottom-left or top-right corner of the target depending on whether the axis parameter is set to 'horizontal'
						 or 'vertical'.  The various combinations of axis and anchor allow the tile to be positioned around the target in all the ways
						 you need to create popout menus.  By default, the algorithm will choose the appropriate axis & anchor to position the tile so that
						 it won't be cropped by the side of the screen, and will follow the standard positioning patterns of a popout menu. All you have
						 to do is provide the target and any x,y offset.  In addition, once auto-positioned by the algorithm, the size of the tile will
						 be modified if the tile is clipping any edge of the screen.  If the tile was sized fluidly, the size will be fixed to ensure 
						 we don't get clipped by the screen, and the overflow will be set to 'auto' to allow for the content within the tile to scroll.

		2. Root: This layout extends positioner, and is designed to be the root tile of the document.  This is essentially the bootstrap tile of the dash, and should
		   be the first tile instantiated.  The tile is hard-coded to use the <body> tag as it's DOM element, and is wired to respond to resize events to resize the
		   dash.  In addition to resize events, this tile also responds to click and drag events which are passed into the drag-and-drop sub-system.

		3. Resizer: This layout will stack its children either horizontally or vertically, depending on the axis option, and will allow the children to be resized
		   by dragging the edges it inserts between its children.  This is the core layout engine that allows for widgets to be tiled on the screen, and when nested
		   inside each other, allow for any complex layout to be achieved.  When you nest them inside each other, a child resizer will automatically take the opposite
		   stacking axis as it's parent. When you remove children from a resizer, if there are fewer than two remaining children, the resizer will automatically 
		   remove itself.  This prevents all kinds of nasty crazyness and keeps the dash free of hidden resizer tiles that invisibly interfere with siblings.  When
		   you drag-and-drop a widget tile into the opposing axis of another tile, a new resizer will be wrapped around the target widget to stack the dropped tile
		   in the orthogonal direction.

		4. Slider: This is how you create sliding marquees, and replicates the functionality of the old dash.  This hasn't been fleshed out yet though, so it won't
		   work yet.

		5. Stacker: This is how you create widgets.  You give it either a vertical or horizontal stacking axis and give one of the child tiles the property of name='body'.
		   All the children that come before the body (headers) will be fixed at the top of the parent.  All the children that come after the body (footers) will be fixed 
		   at the bottom of the parent.  The body will be variably sized in the middle.  The widget tile is derived from this layout.

		6. Spacer: This works almost identically to resizer, but no edges are inserted between tiles, and there is no resizing.  All the children are equal in size.
		   This is essentially the same layout used in Pivotal tracker.


	Here are the methods within a Tile:

		Constructor & Destructor
			.initialize() << standard backbone.view initialize
			.close(delspawned) << formerly known as shutdown(), setting delspawned=true will delete spawned children when closing.
		
		Tile Management
			.detach() << detaches the tile from the parent
			.replace(tile) << replaces this tile with another.  Will detach other tile before attaching it.
			.find(cid) << recursively look for a tile by it's cid in the tree. For example, in the console type: Dash.root.find('view10');
			.superFn(fnName, defaultValue, params...) << make a function call against the parent, and return defaultValue if no-parent.
			.isType(Type) << given a tile constructor, test to see if this tile is of that type
			.isSized() << test to see if the tile has been sized.
			.isReflow() << test to see if a render will cause a local reflow
			.debug() << call this from the terminal to see the tree. For example, in the console type: Dash.root.debug();
			
		Spawn Relationships
			.setSpawner(tile) << used by system when spawning a new tile
			.despawn(tile) << used by system to cut spawning ties

		Child Management
      .addTile(tile, index, defaults) << this is how you add tiles to the parent. 
			.getTiles() << get all the children tiles. Used for serializing the child tiles.
			.setTiles(tiles) << set all the children tiles. Used for de-serializing the child tiles.
			.length() << get the number of child tiles
			.atIndex(index) << get the child at the specified index
			.indexOf(tile) << get the index of the child at the specified index
			.parentInit(parent) << (OVERRIDE) called when being attached to a parent to allow binding or other parent initialization.
			.childInit(child) << (OVERRIDE) called when attaching a child to a parent to allow binding or other child initiailziation.
			.closeChild(child) << (OVERRIDE) called when detaching a child from a parent to allow for unbiding or other child shutdown.
	
		Options API
			.bind(name, params) << this is how you bind an option to the tile. Params is a configuration object
			.unbind(name, buffer) << this is how you unbind an option from the tile. Buffer is a boolen that specifies whether to save values to buffer.
			.set(name, value) << universal option setter.  Can be either name-value pair, or name can be an object of multiple name-value pairs.
			.get(name) << universal option getter. If you don't specify a name, all options will be returned.
			.setter(name, value, target) << default setter for options that don't have a setter and are targeted to this.
			.getter(name, target) << default getter for options that don't have a getter and are targeted to this.
			.bindThis(bindings) << wrapper for bind to simplify binding local options to this. Used by a tile to bind non-geometry properties.
			.bindChild(tile, bindings) << wrapper for bind to simplify binding child options to this. Used by parent to bind to child's geometry properties.
			.bindTile(name, tile, index) << wrapper for bind to simplify adding & binding new child tiles. Used by widgets to expose child header, menu & component properties.
			.bindModel(name, model, options) << wrapper for bind to simplify adding & binding new child models.  Similar addModel() method in old dash widgets.
			
		Change Management
			.beginChange() << signal to tell the dash changes are about to begin.  Wrap all changes with beginChange() and endChange(). Can be nested.
			.endChange() << signal to tell the dash changes are finished. When last nested endChange() call is made, a reflow of the dash is initiated.
			.markChange(tile) << signal to tell the dash this tile needs a reflow.  Do this after beginChange() and before endChange()
			.deferChange(fn) << used by resizer tiles to defer self-closing to end of all changes but before reflow.
			.bubble(tile, child) << system call made after all changes but before reflow rendering to determine top relfow nodes in the tree.
			.render() << (OVERRIDE) default render code for a nested to to resize its children.  Subclasses should override this! Will be wrapped by tile constructor!
			.rendered() << will be automatically called after render() because it has been wrapped.  Clears the reflow change flags.
			.renderTile(tile, css) << set the css on a child tile and trigger child to re-render. Called during a reflow.
			
		DOM Interaction
			.clearCSS() << clear the local css styles.  Called when a child is attached to a new parent.
			.getWidth() << get the width of the tile.  Will use local value to prevent browser DOM reflow if present.
			.getHeight() << get the height of the tile.  Will use local value to prevent browser DOM reflow if present.
			.getPad() << get the element padding + border + margin.  Used by the system to adjust sizing for tiles styled by classes.
			.captureGeometry($el) << called before detaching from parent to capture it's geometry. Used when dragging.
	
		Drag Events
			.setDrag(state) << (OVERRIDE) enable the tile to be dragged.  All this does is add a .drag class to the tile.  The root tile takes care of the rest.
			.dragInit(ev, dd) << (OVERRIDE) called when initializing a drag. return true to capture the drag or false to pass event to parent tile.
			.dragStart(ev, dd) << (OVERRIDE) called when tile is starting to be dragged, i.e. has moved a pixel.  Use to set initial conditions within dd object.
			.dragMove(ev, dd) << (OVERRIDE) called when tile is being dragged.
			.dragEnd(ev, dd) << (OVERRIDE) called when tile is done being dragged. Only called if dragStart was called.
			.dragFinish(ev, dd) << (OVERRIDE) called when tile is totally finished with drag. Clean-up anything set-up within dragInit.
	
		Drop Events
			.setDrop(state) << (OVERRIDE) enable the tile to be dropped into. All this does is add a .drop class to the tile.  The root tile takes care of the rest.
			.dropInit(ev, dd) << (OVERRIDE) called when a drag is starting to check to see if this is a dropzone.  Return true if it is a dropzone.
			.dropOver(ev, dd) << (OVERRIDE) called when a drag enters the dropzone. (DRAGENTER)
			.dropMove(ev, dd) << (OVERRIDE) called when a drag moves within the dropzone. (DRAGOVER)
			.dropOut(ev, dd) << (OVERRIDE) called when a drag leaves the dropzone. (DRAGLEAVE)
			.dropCommit(ev, dd) << (OVERRIDE) called to test whether the dropzone accepted the drop.  Return true to accept, false to reject. (DROP)
			.dropFinish(ev, dd) << (OVERRIDE) called to clean-up anything set-up within dropInit.

		Clickout Events
			.setClickout(state) << Enable the custom clickout event. True = enable clickout event. False = disable clickout event.
			.isClickIn() << System call used by clickout to determine if a click within this tile will trigger a clickout event in the tree.
			.onClickout() << (OVERRIDE) called when clickout enabled on the tile and a clickout has occurred.
		
		Event Capture
			.addEvent(el, types, fn) << Attach a capture event to a DOM element. Used by some system-level events
			.removeEvent(el, types, fn) << Detach a capture event from a DOM element. Used by some system-level events.

	Require.js

		In the main require configuration, we should define our root module paths. One path should be set to wherever the core dash tileset is located.  Another path
		should be set to wherever specific application tiles are located.  Additional paths can be defined for other tilesets, like widgets, or 3rd party tilesets.

		requirejs.config({
  			paths: {
    				dash: 'lib/dash/tiles', 
    				app: 'app/tiles', 

    				tile: 'lib/dash/require/tile',
    				Dash: 'lib/dash/dash'
			}
		});

		In this example, I have mapped the path 'dash' to lib/dash/tiles for the core dash tilset and the path 'app' to app/tiles for the application specific tiles. 
		In addition, I have written a custom require.js plugin for loading tiles.  This should be defined in the main require.js config.  The last essential item to be
		defined in the config is the location of the core Dash object, which contains these properties:

		Dash = {
			Tile,		<< This is the base Tile class that all tiles inherit from.
			Tiles, 		<< Object that contains the full paths of all the loaded tiles.  This is managed by the custom tile require.js plugin.
			Dragdrop,	<< Object used by the Root Tile to manage drag-and-drop
			Options,	<< Object used by all Tiles to handle option managment.
			root,		<< This should be set to the instance of the Root Tile after it's been constructed by the application.
		}
		
		The Dash Object should be loaded by main.js and should be used along with Root.tile.js to bootstrap the application. A minimal bootsrap would look like this:

		requirejs(['Dash', 'tile!dash/root'], function(Dash, Root) {
			Dash.root = new Root();
			Dash.root.add([ ... definition of dash ...]);
		});

		When calling for local tiles defined within an application module, you should always reference locally defined tiles (meaning in the same or nested directory)
		using the relative require.js path syntax using the "./" prefix.  This should come after the "tile!" but before the "tilename" path. An example of this would be:

		define(['jQuery', 'Underscore', 'Backbone', 'Dash', 'tile!./subtile'], function(jQuery, _, Backbone, Dash, Subtile) {
			return Dash.Tile.extend({
				... extend code ...
				var subtile = newSubtile();
				... extend code ...
			});
		});

		This is how you would define a tile in a module to reference a locally defined "subtile".  By using relative references to locally defined tiles, the directory
		of tiles becomes portable and can be used within any location in any project.

		If you want to embed a 3rd party project within a local application, require gives you everything you need to make it work.  For example, if Deseret Connect 
		wanted to take the entire application for Deseret News and embed it within their own, they would configure require in their bootstrap like this:

		requirejs.config({
  			paths: {
    				dash: 'lib/dash/tiles',
    				app: 'app/tiles',
				desnews: 'lib/desnews/tiles',

    				tile: 'lib/dash/require/tile',
    				Dash: 'lib/dash/dash'
			}
			map: {
				'lib/desnews/exports': {
					'dash': 'lib/desnews/lib/dash/tiles',
					'app': 'lib/desnews/app/tiles'
				}
			}
		});

		You could then call a tile from a desnews exports directory by requiring "tile!desnews/theirwidget".  If this widget then went to call some core dash tiles
		like Positioner, Resizer, or other core services with a reference like "tile!dash/positioner", that reference would pull their copy instead of the global
		version in our application.  This is useful for when a 3rd party application needs to use their own version of the core dash tiles (like when they are using
		a different version than our application is using). If we wanted their application to user our application's copy of the core Dash tiles, we would just have
		to delete the following line from the map:

			'dash': 'lib/desnews/lib/dash/tiles',
	
	Things Remaining to Be Done

		Even though this copy of dash v2.0 is 90% finished, there is still a lot to be done.  Here is a list of what I know needs to be done:

		- Focusing when clicking on a tile.
  		- Loading indicator/screen for tiles.
  		- tile.hoverout property & tile.onHoverout() method.
  		- Drag & drop within a tile w/scrolling.
  		- Add error handling to the bind system.
  		- Add auto re-binding of events to models that get replaced within the option system..

	Bugs to be Fixed

  		- Sometimes when you drag, the drop-zone cover appears below the tile being dragged.
  		- Dragging and dropping out-of-zone sometimes looses a tile.
  		- Dragging or closing a tile at the bottom of the screen sometimes causes dash issues.

	End Notes

		I'll be on vacation all of next week, but would love to talk to you on the phone, via email or via text to answer any questions you might have.  If the documentation
		I've provided here doesn't make sense, it's probably because I wrote this at 1:30am last night and am half delirious. Anyway, don't hesitate
		to contact me if you need some assistance.  Know that the code you have here is not finished... it's a work in progress and needs a lot of refining before it's 
		production ready.  When I get back I hope to get it production ready within a week.

	Contact Info

		Andrew Bunker
		Cell: 801.580.1203
		Email: abunker@deseretdigital.com
		

---------------------------------------------------------------------------------------

  Experimental Results

  1. Measuring after each update degrades performance by 10x.
  2. Using raw DOM operations over jquery append improves performance 4x.
  3. Using one .html() over .append improves performance 3x.

---------------------------------------------------------------------------------------

  Drag & Drop Browser Support 
    http://caniuse.com/dragndrop

  Backbone.js Performance Analysis
    http://stackoverflow.com/questions/11744634/lots-of-backbone-views-performance-issues
    http://stackoverflow.com/questions/7147711/backbone-js-performance-problems-too-many-views/7150279#7150279

    http://danielarandaochoa.com/backboneexamples/blog/category/performance/

    - Touching the DOM is expensive.
    - When creating many views, think about how many times you have to touch the DOM.
    http://www.sophomoredev.com/2012/06/a-different-approach-to-rendering-backbone-sub-views/
    
    - when you're dealing with large numbers of DOM elements, you absolutely don't want to have an individual View for each element. 
    - At the other extreme, you don't want to have a single View for your entire application. Find a balance that makes sense, and represents a logical chunk of UI.
    - Especially in older browsers, where performance matters most.
    - setting a single innerHTML call with a bunch of HTML is far cheaper than doing the equivalent number of DOM-twiddling operations.
    https://news.ycombinator.com/item?id=4111894

    - Another common problem that is often visible with large collections is that on update or change, we render a view for every single model in the collection. 
    - While this is sometimes necessary, it can lead to severe performance issues and adversely affect UI responsiveness. Especially on old computers and mobile devices.
    - The reason for this is that every .append() we do in the render function causes the DOM to reflow - meaning that the browser has to recalculate the position and size of every element in the DOM tree.
    http://ozkatz.github.io/avoiding-common-backbonejs-pitfalls.html

    - Manipulating the dom is slow, it triggers a reflow of the page, this is costly even on small lists, specially on mobile.
    http://backbonefu.com/2012/01/optimizing-the-views-list-creation-with-document-fragment/

    - EXCELLENT TIPS!
    https://developers.google.com/speed/articles/javascript-dom

    - ABOUT REFLOW
    https://developer.mozilla.org/en-US/docs/Notes_on_HTML_Reflow

    - THE MOZILLA XUL BOX MODEL (exactly like tiles!)
    https://developer.mozilla.org/en-US/docs/XUL/Tutorial/The_Box_Model
    http://mb.eschew.org/2
    https://developer.mozilla.org/en-US/docs/Introduction_to_Layout_in_Mozilla

    - The Andriod layout model
    - (note) Each child element must define LayoutParams that are appropriate for its parent, though it may also define different LayoutParams for its own children.
    http://developer.android.com/guide/topics/ui/declaring-layout.html#Position

    - Performance tips from smashing magagazine
    http://coding.smashingmagazine.com/2012/11/05/writing-fast-memory-efficient-javascript/

    - Google web toolkit (panels)
    https://developers.google.com/web-toolkit/doc/latest/DevGuideUiPanels

    JsPef
    http://jsperf.com/document-fragments-vs-appendchild/2
    http://jsperf.com/building-and-appending-to-the-dom/2

---------------------------------------------------------------------------------------

  Reflow Notes

---------------------------------------------------------------------------------------
  
  [list]
    (self) axis: vertical | horizontal
    (self) contain: true | false
    (self) scroll: true | false
    (self) minWeight: 0
    (self) maxWeight: 0
    (child) weight: px
    (child) enable: true | false

  ----

  Grid:
    Columns[list]: (width, height) (enable, min_width, max_width, force_fit, resizable, draggable)
      Column: (enable, weight) (edit_tile)
    Rows[list]: (enable, min_height, max_height, force_fit, resizable, draggable, row_tile)
      Row: (enable, height)
    Table[list]:
      Line: (model)
        Cell: () <react_event>

  ----
  
  Root
    Screen
      Header
      Dash
        Widget
          Header
          Menu
          Body
          Footer
        Dash
          Widget
          Dash
            Widget
            Widget
          Widget