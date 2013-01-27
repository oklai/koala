/**
 * main.js
 */

'use strict'; 

//test starting time
global.startTime = new Date();

//share main context
var gui = require('nw.gui'); 
global.gui = gui;
global.mainWindow = gui.Window.get();
global.jQuery = jQuery;
global.debug = function(messge) {
	global.mainWindow.window.console.log(messge);
};

//cache current active project 
global.activeProject = '';

//distinguish between different platforms
$('body').addClass(process.platform);

//Application initialization
require('./app/initialization.js').init();

//bind dom events
require('./app/documentEvents.js');

//bind window resizable events
if (process.platform === 'win32') {
	require('./app/windowResizable.js');	
}
