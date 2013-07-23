/**
 * main.js
 */

'use strict';

var path        = require('path'),
    fs          = require('fs'),
    FileManager = require('./scripts/FileManager');

if (!fs.existsSync(FileManager.userDataDir)) {
    fs.mkdirSync(FileManager.userDataDir);
}
if (!fs.existsSync(FileManager.userExtensionsDir)) {
    fs.mkdirSync(FileManager.userExtensionsDir);
}
if (!fs.existsSync(FileManager.userLocalesDir)) {
    fs.mkdirSync(FileManager.userLocalesDir);
}

//Add error event listener
process.on('uncaughtException', function (err) {
    fs.appendFile(FileManager.errorLogFile, '---uncaughtException---\n' + err.stack + '\n\n');
    jQuery('.koalaui-loading,.koalaui-overlay').remove();
});

window.addEventListener('error', function (err) {
    var message = '---error---\n' + err.filename + ':' + err.lineno + '\n' + err.message + '\n\n';
    fs.appendFile(FileManager.errorLogFile, message);
    jQuery('.koalaui-loading,.koalaui-overlay').remove();
}, false);

//share main context
var gui = require('nw.gui');
global.gui = gui;
global.mainWindow = gui.Window.get();
global.jQuery = jQuery;

global.getFileManager = function () {
    return FileManager;
};
if (require('../package.json').appinfo.debug) {
    global.debug = console.log.bind(console);
} else {
    global.debug = function () {};
}

//cache current active project
global.activeProject = '';

//distinguish between different platforms
$('body').addClass(process.platform);

// render pages && application initialization
require('./scripts/renderpage.js');
require('./scripts/initialization.js');