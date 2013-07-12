/**
 * render page content from jade template
 */

"use strict";

var jade           = require("jade"),
	fs             = require("fs"),
	path           = require('path'),
	storage        = require('./storage.js'),
	$              = global.jQuery,
	sessionStorage = global.mainWindow.window.sessionStorage;

//cache jade template
(function () {
	var jadesDir  = global.appRootPth  + '/views/release/',
		jadeNames = ['main/files', 'main/folders', 'main/nav', 'main/settings', 'settings/inner'];

	jadeNames.forEach(function (jadeName) {
		var filename = jadesDir + jadeName + '.jade';
		sessionStorage.setItem(jadeName + 'JadeFileName', filename);
		sessionStorage.setItem(jadeName + 'Jade', fs.readFileSync(filename, 'utf8'));
	});
})();

/**
 * render project list
 * @param  {Array} data  projects data
 * @return {Object}      project list elements 
 */
exports.renderFolders  = function(data) {
	var fn = jade.compile(sessionStorage.getItem('main/foldersJade'), {filename: sessionStorage.getItem('main/foldersJadeFileName')});
	return fn({folders: data});
}

/**
 * render file list
 * @param  {Array}  data files data
 * @return {Object} file list elements
 */
exports.renderFiles  = function(data) {
	var pid = data[0].pid,
		parentSrc = storage.getProjects()[pid].src;

	//shorten the path
	data.forEach(function (item) {
		item.shortSrc = path.relative(parentSrc, item.src);
		item.shortOutput = path.relative(parentSrc, item.output);
	});

	var fn = jade.compile(sessionStorage.getItem('main/filesJade'), {filename: sessionStorage.getItem('main/filesJadeFileName')});
	return fn({files: data, parentSrc: parentSrc});
}

/**
 * render nav bar
 * @param  {Object} fileTypes all file types
 * @return {Object} nav elements
 */
exports.renderNav = function (fileTypes) {
	var fn = jade.compile(sessionStorage.getItem('main/navJade'), {filename: sessionStorage.getItem('main/navJadeFileName')});
	return $(fn({fileTypes: fileTypes}));
}

/**
 * render file settings
 * @param  {Object} file data
 * @param  {FileType} fileType file type
 * @param  {Compiler} compiler
 * @return {Object} file elements
 */
exports.renderSettings = function (file, fileType, compiler) {
	file.name = path.basename(file.src);
	var fn = jade.compile(sessionStorage.getItem('main/settingsJade'), {filename: sessionStorage.getItem('main/settingsJadeFileName')});
	return $(fn({file: file, type: fileType, compiler: compiler}));
}

/**
 * render app settings
 * @param  {Object} compilers all compilers
 * @return {Object}           setting elements
 */
exports.renderAppSettings = function (compilers) {
	var fn = jade.compile(sessionStorage.getItem('settings/innerJade'), {filename: sessionStorage.getItem('settings/innerJadeFileName')});
	return $(fn({compilers: compilers}));
}
