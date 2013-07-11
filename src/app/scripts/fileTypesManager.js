/**
 * file types manager module
 */

'use strict';

var fs     = require('fs'),
	util   = require('./util.js'),
	FileType = require('./FileType');

// load file types from fileTypes.json
var fileTypesString = fs.readFileSync(global.appRootPth + '/fileTypes.json', 'utf8'),
	fileTypes = {};

fileTypesString = util.replaceJsonComments(fileTypesString);
try {
	fileTypes = JSON.parse(fileTypesString);
} catch (e) {
	return  fileTypes;
}

fileTypes.forEach(function (fileType) {
	new FileType(fileType);
});

/**
 * get file types
 * @return {Array} file types
 */
exports.getFileTypes = function () {
	return FileType.getFileTypes();
};

/**
 * get file type for the given extension, or null if not found.
 * @param  {String} ext an extension.
 * @return {Object} file type for "ext", or null.
 */
exports.fileTypeForExtension = function (ext) {
	return FileType.fileTypeForExtension(ext);
};

/**
 * get file type with the given name, or null if not found.
 * @param  {String} name of the file type.
 * @return {Object} file type named "name", or null.
 */
exports.fileTypeWithName = function (name) {
	return FileType.fileTypeWithName(name);
};