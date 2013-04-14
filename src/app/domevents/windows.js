/**
 * window management
 */

'use strict'; 

var appConfig      = require('../appConfig.js').getAppConfig(),
	$              = global.jQuery,
	document       = global.mainWindow.window.document;

//open settings window
$(document).on('click', '#settings', function () {
	if (global.settingsWindow) {
		global.settingsWindow.close(true);
		global.settingsWindow = null;
	}
	
	var options = {
		width: 400,
		height: 500,
		resizable: false,
		toolbar: false,
		position: "center",
		icon: "img/koala.png"
	};
	var url = 'html/' + appConfig.locales + '/settings.html';
	global.settingsWindow = global.gui.Window.open(url, options);
});

//open log window
$(document).on('click', '#log', function () {
	if (global.logWindow) {
		global.logWindow.close(true);
		global.settingsWindow = null;
	}
	
	var options = {
			width: 640,
			height: 420,
			resizable: false,
			toolbar: false,
			position: "center",
			icon: "img/koala.png"
		},
		url = 'html/' + appConfig.locales + '/log.html';
	
	global.logWindow = global.gui.Window.open(url, options);
});

//window minimize & close 
if (process.platform === 'win32') {
	$(document).on('click', '#titlebar .minimize', function () {
		global.mainWindow.minimize();
	});
	$(document).on('click', '#titlebar .close', function () {
		global.mainWindow.close();
	});
}