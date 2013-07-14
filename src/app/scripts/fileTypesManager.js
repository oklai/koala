/**
 * file types manager module
 */

'use strict';

var fs         = require('fs'),
	util       = require('./util'),
	FileType   = require('./FileType'),
	fileTypes  = {},
	extensions = [];

exports.loadFileTypes = function () {
	// load file types from fileTypes.json
	var fileTypesConfigString = fs.readFileSync(global.appRootPth + '/fileTypes/fileTypes.json', 'utf8'),
		fileTypesConfig = {};

	fileTypesConfigString = util.replaceJsonComments(fileTypesConfigString);
	try {
		fileTypesConfig = JSON.parse(fileTypesConfigString);
	} catch (e) {}

	fileTypesConfig.forEach(function (fileTypeConfig) {
		var fileType = new FileType(fileTypeConfig);
		fileTypes[fileType.name] = fileType;
		extensions = extensions.concat(fileType.extensions);
	});
};

/**
 * get file types
 * @return {Object} file types
 */
exports.getFileTypes = function () {
	return fileTypes;
};

/**
 * get all effective extensions
 * @return {array} extensions
 */
exports.getAllExtensions = function () {
	return extensions;
};

/**
 * get file type for the given extension, or null if not found.
 * @param  {String} ext an extension.
 * @return {Object} file type for "ext", or null.
 */
exports.fileTypeForExtension = function (ext) {
	for (var k in fileTypes) {
		if (fileTypes[k].extensions.indexOf(ext) > -1) {
			return fileTypes[k];
		}
	}

	return null;
};

/**
 * get file type with the given name, or null if not found.
 * @param  {String} name of the file type.
 * @return {Object} file type named "name", or null.
 */
exports.fileTypeWithName = function (name) {
	return fileTypes[name] || null;
};
