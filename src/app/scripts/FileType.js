/**
 * FileType module
 */

'use strict';

var util      = require('./util'),
	fileTypes = [];

/**
 * Create a fileType from the config.
 * @param {Object} config the configuration to use to create the fileType.
 */
function FileType(config) {
	this.name = config.name;
	this.extensions = util.asArray(config.extensions);

	this.display = {};
	this.display.name = config.display.name;
	this.display.extensions = util.asArray(config.display.extensions);

	fileTypes.push(this);
}

module.exports = FileType;

/**
 * get file types
 * @return {Array} file types
 */
FileType.getFileTypes = function () {
	return fileTypes;
};

/**
 * get file type for the given extension, or null if not found.
 * @param  {String} ext an extension.
 * @return {Object} file type for "ext", or null.
 */
FileType.fileTypeForExtension = function (ext) {
	var i;
	for (i = 0; i < fileTypes.length; i++) {
		if (fileTypes[i].extensions.indexOf(ext) !== -1) {
			return fileTypes[i];
		}
	}
	return null;
};

/**
 * get file type with the given name, or null if not found.
 * @param  {String} name of the file type.
 * @return {Object} file type named "name", or null.
 */
FileType.fileTypeWithName = function (name) {
	var i;
	for (i = 0; i < fileTypes.length; i++) {
		if (fileTypes[i].name === name) {
			return fileTypes[i];
		}
	}
	return null;
};

FileType.prototype.getDisplay = function (propertyPath) {
	var props = propertyPath.split('.'),
		i, value;

	for (i = 0, value = this.display; i < props.length && value; i++) {
		value = value[props[i]];
	}
	if (!value) {
		for (i = 0, value = this; i < props.length && value; i++) {
			value = value[props[i]];
		}
	}

	return value;
};

FileType.prototype.toJSON = function () {
	var json = {};

	json.name = this.name;
	json.extensions = this.extensions;

	if (!util.isEmpty(json.display)) {
		json.display = {};
		if (this.display.name) {
			json.display.name = this.display.name;
		}
		if (this.display.extensions) {
			json.display.extensions = this.display.extensions;
		}
	}
};
