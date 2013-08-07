/**
 * Extension module
 */

'use strict';

var util             = require('./util'),
    // compilersManager = require('./compilersManager'),
    // fileTypesManager = require('./fileTypesManager'),
    localesManager   = require('./localesManager');

/**
 * Create a Extension from the config.
 * @param {Object} config the configuration to use to create the extension.
 */
function Extension(config, dir) {
    this.name = config.name;
    this.version = config.version;

    this.display = {};
    if (config.display) {
        this.display.name = config.display.name;
    }

    this.fileTypes = [];
    util.asArray(config.fileTypes).forEach(function (fileTypeConfig) {
        // this.fileTypes.push(fileTypesManager.addFileTypeWithConfig(fileTypeConfig, dir));
    }.bind(this));

    this.compilers = [];
    util.asArray(config.compilers).forEach(function (compilerConfig) {
        // this.compilers.push(compilersManager.addCompilerWithConfig(compilerConfig, dir));
    }.bind(this));

    this.locales = [];
    util.asArray(config.locales).forEach(function (localsConfig) {
        // TODO:: implement
        // this.locales.push(localesManager.loadFileType(localsConfig));
    }.bind(this));
}

module.exports = Extension;

Extension.prototype.getDisplay = function (propertyPath) {
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

Extension.prototype.toJSON = function () {
    var json = {};

    json.name = this.name;
    json.version = this.version;

    if (!util.isEmpty(json.display)) {
        json.display = {};
        if (this.display.name) {
            json.display.name = this.display.name;
        }
    }
};
