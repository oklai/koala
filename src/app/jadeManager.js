/**
 * render page content from jade template
 */

"use strict";

var jade = require("jade"),
	fs = require("fs"),
	storage = require('./storage.js'),
	$ = global.jQuery;

//cache jade template
var foldersJade, filesJade;

/**
 * render project list
 * @param  {Array} data  projects data
 * @return {Object}      project list elements 
 */
exports.renderFolders  = function(data) {
	if (!foldersJade) {
		foldersJade = fs.readFileSync("./jade/folders.jade");	
	}
	var fn = jade.compile(foldersJade);
	return fn({folders: data});
}

/**
 * render file list
 * @param  {Array}  data files data
 * @return {Object}      file list elements
 */
exports.renderFiles  = function(data) {
	if (!filesJade) {
		filesJade = fs.readFileSync("./jade/files.jade");
	}
	var fn = jade.compile(filesJade),
		htmlString = fn({files: data});

	return renderFileSettings(htmlString);
}

/**
 * render file settings
 * @param  {String} htmlString files html string
 * @return {Object}            file elements
 */
function renderFileSettings (htmlString) {
	var projectsDb = storage.getProjects(),
		fileElements = $(htmlString);
	$(fileElements).each(function () {
		var self = $(this),
			pid  = self.data('pid'),
			src  = self.data('src'),
			file = projectsDb[pid].files[src],
			settings = file.settings;

		//render compile status
		if (!file.compile) {
			self.addClass('disable');
			self.find('.notcompile')[0].checked = true;
		}
		//render output style option
		if (settings.outputStyle) {
			var options = self.find('.outputStyle option');
			for (var i = 0; i < options.length; i++) {
				if (options[i].value === settings.outputStyle) {
					$(options[i]).attr('selected', 'selected');
					break;
				}
			} 
		}
		//render sass compass mode
		if (settings.compass) {
			self.find('.compass')[0].checked = true;
		}
	});

	return fileElements;
}