/**
 * main.js
 */

'use strict'; 

var path = require('path'),
	fs   = require('fs'),
	userDataDir = process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'] + '/.koala',
	errorLog = userDataDir + '/error.log'; 

	//make user data dir
	if (!fs.existsSync(userDataDir)) { fs.mkdirSync(userDataDir); }

//Add error event listener
process.on('uncaughtException', function (err) {
	fs.appendFile(errorLog, '---uncaughtException---\n' + err.stack + '\n\n');
	jQuery('.koalaui-loading,.koalaui-overlay').remove();
});

window.addEventListener('error', function (err) {
	var message = '---error---\n' + err.filename + ':' + err.lineno + '\n' + err.message + '\n\n';
	fs.appendFile(errorLog, message);
	jQuery('.koalaui-loading,.koalaui-overlay').remove();
}, false);

//share main context
var gui = require('nw.gui'); 
global.gui = gui;
global.mainWindow = gui.Window.get();
global.jQuery = jQuery;
global.debug = function(messge) {
	console.log(messge);
};

//cache current active project 
global.activeProject = '';

//distinguish between different platforms
$('body').addClass(process.platform);

//Application initialization
require('./app/initialization.js').init();