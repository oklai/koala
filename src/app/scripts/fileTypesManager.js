/**
 * compilers manager module
 */

'use strict';

exports.fileTypes = {};

/**
 * Add File Type Object
 * @param {object} typeObj File Type Object
 */
exports.addFileType = function (typeObj) {
	for (var k in typeObj) {
		exports.fileTypes[k] = typeObj[k];
	}
}

/**
 * Get File Types
 * @return {object} file types
 */
exports.getFileTypes = function () {
	return exports.fileTypes;
}

/**
 * Get File Types As A Array
 * @return {array} file types
 */
exports.getFileTypesAsArray = function () {
	var fileTypes = [];
	for (var k in exports.fileTypes) {
		fileTypes.push(exports.fileTypes[k]);
	}
	return fileTypes;
}

/**
 * Get File Type Object By File Extension
 * @param  {string} ext file extension
 * @return {object}     file type
 */
exports.getFileTypeByExt = function (ext) {
	return exports.fileTypes[ext];
}

/**
 * Get Extensions
 * @return {array} extensions
 */
exports.getExtensions = function () {
	return Object.keys(exports.fileTypes);
}

/**
 * Get Extensions Of Category
 * @param  {string} category category name
 * @return {array}          extensions
 */
exports.getExtsByCategory = function (category) {
	var exts = [];

	for (var k in exports.fileTypes) {
		if (exports.fileTypes[k].category === category) {
			exts.push(k);
		}
	}
	
	return exts;
}