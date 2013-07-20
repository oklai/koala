/**
 * Compiler module
 */

'use strict';

var path             = require('path'),
    fs               = require('fs'),
    fileTypesManager = require('./fileTypesManager'),
    util             = require('./util');

/**
 * Create a compiler from the config.
 * @param {Object} config the configuration to use to create the compiler.
 */
function Compiler(config, dir) {
    this.name = config.name;
    this.compilerVersion = config.compiler_version;

    this.outputExtensions = {};
    this.fileTypeNames = [];
    this.fileTypes = [];
    util.asArray(config.file_types).forEach(function (fileTypeConfig) {
        var fileType = fileTypesManager.addFileTypeWithConfig(fileTypeConfig, dir);
        this.fileTypes.push(fileType);
        this.fileTypeNames.push(fileType.name);
        this.outputExtensions[fileType.name] = fileTypeConfig.output_extension;
    }.bind(this));

    this.useSystemCommand = config.use_system_command;
    this.newOptions = util.asArray(config.options);

    this.options = [];
    this.outputStyle = [];
    this.display = {
        name: this.name,
        options: [],
        outputStyle: []
    };
    this.defaults = {
        options: {},
        useSystemCommand: this.useSystemCommand
    };

    this.newOptions.forEach(function (option) {
        switch (option.type) {
            case "single":
                this.options.push(option.name);
                this.display.options.push(option.display);
                this.defaults.options[option.name] = option.default;
                break;
            case "multiple":
                if (option.name === "outputStyle") {
                    util.asArray(option.values).forEach(function (value) {
                        if (!util.isObject(value)) {
                            value = {value: value };
                        }
                        this.outputStyle.push(value.value);
                        this.display.outputStyle.push(value.display || value.value);
                    }.bind(this));
                    this.defaults.outputStyle = option.default;
                }
                break;
            default:
                throw new Error("Unexpected option type '" + option.type + "' for compiler '" + this.name + "'.");
       }
    }.bind(this));
}

module.exports = Compiler;

Compiler.prototype.accepts = function (fileExt) {
    return this.fileTypes.some(function (fileType) {
        return fileType.extensions.indexOf(fileExt) !== -1;
    });
};

Compiler.prototype.getDisplay = function (propertyPath) {
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

Compiler.prototype.hasOptions = function () {
    return !util.isEmpty(this.options);
};

Compiler.prototype.hasOutputStyle = function () {
    return !util.isEmpty(this.outputStyle);
};

Compiler.prototype.getOutputExtensionForInputExtension = function (fileTypeName) {
    return this.outputExtensions[fileTypeName];
};

Compiler.prototype.toJSON = function () {
    // TODO:: update

    var json = {};

    json.name = this.name;
    json.compiler_version = this.compilerVersion;
    json.fileTypes = this.fileTypeNames;
    json.output_extensions = this.outputExtensions;

    if (!util.isEmpty(json.options)) {
        json.options = this.newOptions;
    }
    if (!util.isEmpty(json.outputStyle)) {
        json.outputStyle = this.outputStyle;
    }

    if (!util.isEmpty(json.display)) {
        json.display = {};
        if (this.display.name) {
            json.display.name = this.display.name;
        }
        if (this.display.options) {
            json.display.options = this.display.options;
        }
        if (this.display.outputStyle) {
            json.display.outputStyle = this.display.outputStyle;
        }
    }

    if (!util.isEmpty(this.defaults)) {
        json.defaults = this.defaults;
    }
};
