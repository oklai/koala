/**
 * render page content from jade template
 */

"use strict";

var jade           = require("jade"),
	fs             = require("fs"),
	path           = require('path'),
	storage        = require('./storage.js'),
	$              = global.jQuery,
	sessionStorage = global.mainWindow.window.sessionStorage,
	appConfig      = require('./appConfig.js').getAppConfig(),
	locales        = appConfig.locales;

//cache jade template
sessionStorage.setItem('foldersJade', fs.readFileSync('./jade/' + locales + '/tmpl_folders.jade', 'utf8'));
sessionStorage.setItem('filesJade', fs.readFileSync('./jade/' + locales + '/tmpl_files.jade', 'utf8'));
sessionStorage.setItem('settingsJade', fs.readFileSync('./jade/' + locales + '/tmpl_settings.jade', 'utf8'));

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
	var fn      = jade.compile(sessionStorage.getItem('settingsJade')),
		element = $(fn({file: data}));

	var file     = data,
		pid      = file.pid,
		src      = file.src,
		settings = file.settings;

	var type = /sass|scss/.test(file.type) ? 'sass' : file.type;
	if (type === 'less') {
		for (var k in appConfig.less) {
			if (!settings.hasOwnProperty(k)) {
				settings[k] = appConfig.less[k];
			}
		}
	}

	if (type === 'sass') {
		for (var k in appConfig.sass) {
			if (!settings.hasOwnProperty(k)) {
				settings[k] = appConfig.sass[k];
			}
		}
	}
	
	if (type === 'coffee') {
		for (var k in appConfig.coffeescript) {
			if (!settings.hasOwnProperty(k)) {
				settings[k] = appConfig.coffeescript[k];
			}
		}
	}

	//get target file name
	element.find('.targetName').html(path.basename(src));

	//render compile status
	element.find('.compileStatus')[0].checked = file.compile;

	if (/sass|scss|less/.test(file.type)) {
		if (settings.lineComments) {
			element.find('.lineComments')[0].checked = true;
		}
	}

	if (/sass|scss/.test(file.type)) {
		//render sass compass mode
		if (settings.compass) {
			element.find('.compass')[0].checked = true;
		}
		if (settings.unixNewlines) {
			element.find('.unixNewlines')[0].checked = true;
		}
	}

	if(file.type === 'coffee') {
		if (settings.bare) {
			element.find('.bare')[0].checked = true;
		}
		if (settings.lint) {
			element.find('.lint')[0].checked = true;
		}
	}

	//render output style option
	if (settings.outputStyle) {
		var options = element.find('.outputStyle option');
		for (var i = 0; i < options.length; i++) {
			if (options[i].value === settings.outputStyle) {
				$(options[i]).attr('selected', 'selected');
				break;
			}
		} 
	}

	return element;
}