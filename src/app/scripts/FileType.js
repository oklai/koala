/**
 * FileType module
 */

'use strict';

var path   = require('path'),
    assert = require('assert'),
    util   = require('./util');

/**
 * Create a fileType from the config.
 * @param {Object} config the configuration to use to create the fileType.
 */
function FileType(config, dir) {
    assert(config, "'config' argument is required");
    assert(util.asArray(config.extension || config.extensions).length > 0, "'config' must contain 'extension' or 'extensions'");
    assert(config.category, "'config' must contain 'category'");

    this.extensions = util.asArray(config.extensions || config.extension);
    this.name = config.name || this.extensions[0];
    this.output = config.output || this.extensions[0];
    this.icon = path.resolve(dir || config.configPath, config.icon || (this.name + ".png"));
    this.category = config.category;
    this.watch = config.watch !== false;

    this.display = {};
}

module.exports = FileType;

FileType.prototype.hasExtension = function (extension) {
    return this.extensions.indexOf(extension) !== -1;
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
