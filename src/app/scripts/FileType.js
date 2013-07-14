/**
 * FileType module
 */

'use strict';

var util = require('./util');

/**
 * Create a fileType from the config.
 * @param {Object} config the configuration to use to create the fileType.
 */
function FileType(config) {
	this.name = config.name;
	this.extensions = util.asArray(config.extensions);
	this.icons = util.asArray(config.icons, [this.name]);

	this.display = {};
	this.display.name = config.display.name;
	this.display.extensions = util.asArray(config.display.extensions);
}

module.exports = FileType;

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
