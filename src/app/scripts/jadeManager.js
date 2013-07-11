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
	var jadetmpl = $('<div/>').html(fs.readFileSync(global.appRootPth  + '/views/release/jadetmpl.html', 'utf8'));

	sessionStorage.setItem('filesJade', jadetmpl.find('#tmpl_files').html());
	sessionStorage.setItem('foldersJade', jadetmpl.find('#tmpl_forders').html());
	sessionStorage.setItem('settingsJade', jadetmpl.find('#tmpl_settings').html());
})();

/**
 * render project list
 * @param  {Array} data  projects data
 * @return {Object}      project list elements 
 */
exports.renderFolders  = function(data) {
	var fn = jade.compile(sessionStorage.getItem('foldersJade'));
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

	var fn = jade.compile(sessionStorage.getItem('filesJade'));
	return fn({files: data, parentSrc: parentSrc});
}

/**
 * render file settings
 * @param  {Object} file data
 * @return {Object} file elements
 */
exports.renderSettings = function (data) {
	data.name = path.basename(data.src);
	var fn = jade.compile(sessionStorage.getItem('settingsJade'));
	return $(fn({file: data}));
}