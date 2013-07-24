/**
 * Compiler module
 */

'use strict';

var path             = require('path'),
    fs               = require('fs'),
    assert           = require('assert'),
    fileTypesManager = require('./fileTypesManager'),
    util             = require('./util'),
    notifier         = require('./notifier'),
    appConfig        = require('./appConfigManager').getAppConfig();

/**
 * Create a compiler from the config.
 * @param {Object} config the configuration to use to create the compiler.
 */
function Compiler(config, dir) {
    assert(config, "'config' argument is required");
    assert(config.name, "'config' must contain 'name'");
    assert(util.asArray(config.file_types).length > 0, "'config' must contain 'file_types'");

    this.name = config.name;
    this.display = config.display;

    this.fileTypes = [];
    util.asArray(config.file_types).forEach(function (fileTypeConfig) {
        fileTypeConfig.configPath = config.configPath;
        var fileType = fileTypesManager.addFileTypeWithConfig(fileTypeConfig, dir);
        fileType.compiler = this.name;
        this.fileTypes.push(fileType);
    }.bind(this));

    this.options = [];
    util.asArray(config.options).forEach(function (option) {
        var items;
        switch (option.type) {
            case "single":
                this.options.push({
                    name: option.name,
                    display: option.display || option.name,
                    type: option.type,
                    "default": option.default || false
                });
                break;
            case "multiple":
                items = [];
                util.asArray(option.items).forEach(function (item) {
                    if (util.isObject(item)) {
                        items.push({
                            value: item.value,
                            text: item.text || item.value
                        });
                    } else if (typeof item === "string") {
                        items.push({
                            value: item,
                            text: item
                        });
                    }
                }, this);
                this.options.push({
                    name: option.name,
                    display: option.display || option.name,
                    type: option.type,
                    items: items,
                    "default": option.default || items[0].value
                });
                break;
            default:
                // Ignore what you don't understand in order to be forward compatible (like css)
                // throw new Error("Unexpected option type '" + option.type + "' for compiler '" + this.name + "'.");
       }
    }, this);

    this.commands = util.asArray(config.commands);
    this.libraries = util.asArray(config.libs);
}

module.exports = Compiler;

Compiler.prototype.accepts = function (fileExt) {
    return this.fileTypes.some(function (fileType) {
        return fileType.extensions.indexOf(fileExt) !== -1;
    });
};

// Compiler.prototype.getDisplay = function (propertyPath) {
//     var props = propertyPath.split('.'),
//         i, value;

//     for (i = 0, value = this.display; i < props.length && value; i++) {
//         value = value[props[i]];
//     }
//     if (!value) {
//         for (i = 0, value = this; i < props.length && value; i++) {
//             value = value[props[i]];
//         }
//     }

//     return value;
// };

Compiler.prototype.hasOptions = function () {
    return !util.isEmpty(this.options);
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



Compiler.prototype.getImports = function (filePath) {
    return [];
};

Compiler.prototype.compile = function (file, success, fail) {
    var useSystemCommand = {};
    Object.keys(appConfig.useSystemCommand).forEach(function (commandName) {
        if (this.commands.indexOf(commandName) !== -1) {
            useSystemCommand[commandName] = this[commandName];
        }
    }, appConfig.useSystemCommand);

    this.compileFile(file, useSystemCommand, function (err) {
        if (err) {
            if (fail) fail();
            notifier.throwError(err.message, file.src);
            return;
        }
        if (success) success();
    });
};

Compiler.prototype.compileFile = function (file, useSystemCommand, done) {
    this.compileFileWithLib(file, done);
};

Compiler.prototype.compileFileWithLib = function (file, done) {
    var options = file.settings;

    // read code
    fs.readFile(file.src, "utf8", function (rErr, code) {
        if (rErr) {
            return done(rErr);
        }

        try {
            this.compileSource(code, path.basename(file.src, path.extname(file.src)), options, function (cErr, compiledSource) {
                if (cErr) {
                    return done(cErr);
                }

                // write output
                fs.writeFile(file.output, compiledSource, "utf8", function (wErr) {
                    if (wErr) {
                        return done(wErr);
                    }

                    done();
                });
            }.bind(this));
        } catch (err) {
            done(err);
        }
    }.bind(this));
};

Compiler.prototype.compileSource = function (sourceCode, options, done) {
    done(null, sourceCode);
};
