/**
 * Extension module
 */

'use strict';

var util             = require('./util'),
    compilersManager = require('./compilersManager');

/**
 * Create a Extension from the config.
 * @param {Object} config the configuration to use to create the extension.
 */
function Extension(config, dir) {
    this.name = config.name;
    this.description = config.description;
    this.version = config.version;
    this.koalaVersion = config.koala_version || "*";

    this.display = {};
    if (config.display) {
        this.display.name = config.display;
    }

    this.maintainers = util.asArray(config.maintainers);

    this.compilers = [];
    util.asArray(config.compilers).forEach(function (compilerConfig) {
        this.compilers.push(compilersManager.addCompilerWithConfig(compilerConfig, dir));
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
    json.description = this.description;
    json.version = this.version;
    json.koala_version = this.koalaVersion;

    if (!util.isEmpty(json.display)) {
        json.display_name = this.display.name;
    }

    json.maintainers = this.maintainers;
};
