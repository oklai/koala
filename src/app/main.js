//主界面

'use strict'; 

//测试启动时间
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

//Application initialization
require('./app/initialization.js').init();

//bind dom events
require('./app/documentEvents.js');