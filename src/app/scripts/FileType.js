/**
 * FileType module
 */

'use strict';

var path = require('path'),
    util = require('./util');

/**
 * Create a fileType from the config.
 * @param {Object} config the configuration to use to create the fileType.
 */
function FileType(config) {
    this.name = config.name;
    this.extensions = util.asArray(config.extensions);
    
    var icons = util.asArray(config.icons, [this.name + ".png"]);
    
    this.icons = icons.map(function (item) {
        return path.resolve(config.configPath, item);
    })

    this.display = {};
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
