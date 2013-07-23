/**
 * compilers manager module
 */

'use strict';

var fs                   = require('fs-extra'),
    path                 = require('path'),
    util                 = require('./util'),
    fileManager          = require('./FileManager'),
    fileTypesManager     = require('./fileTypesManager');

exports.compilers = {};

/**
 * Get Default Settings
 * @param  {object} compiler
 * @return {object} Settings
 */
var getSettings = function (compiler) {
    var settings = {};
    compiler.options.forEach(function (item) {
        settings[item.name] = item.default;
    });
    return settings;
}

exports.addCompilerWithConfig = function (compilerConfig, dir) {
    var CompilerClass, compiler;
    if (!compilerConfig) {
        return null;
    }
    compilerConfig.configPath = dir;

    CompilerClass = require(path.resolve(dir, compilerConfig.main));
    compiler = new CompilerClass(compilerConfig, dir);
    exports.compilers[compiler.name] = compiler;

    return compiler;
};

/**
 * Load Built-in Compilers
 */
var loadBuiltInCompilers = function () {
    // var packagePath = path.join(fileManager.appExtensionsDir, 'package.json'),
    //     packageData = util.readJsonSync(packagePath),
    //     compilers = {},
    //     fileTypes = {};

    // packageData.forEach(function (item) {
    //     // get file type of compiler
    //     item.file_types.forEach(function (type) {
    //         type.compiler = item.name;
    //         type.icon = path.resolve(fileManager.appExtensionsDir, type.icon);
    //         fileTypes[type.extension] = type;
    //     });

    //     // cache compiler
    //     delete item.file_types;
    //     item.configPath = fileManager.appExtensionsDir;
    //     compilers[item.name] = item;
    // });

    // exports.compilers = compilers;
    // exports.fileTypes = fileTypes;
};

/**
 * Get Compilers
 * @return {object} compilers
 */
exports.getCompilers = function () {
    return exports.compilers;
};

/**
 * Get Compilers As A Array
 * @return {array} compilers
 */
exports.getCompilersAsArray = function () {
    return Object.keys(exports.compilers).map(function (compilerName) {
        return this[compilerName];
    }, exports.compilers);
};

/**
 * Get Compiler By Name
 * @param  {string} name compiler name
 * @return {Object}      compiler object
 */
exports.getCompilerWithName = function (name) {
    return exports.compilers[name];
};

/**
 * Get the compiler for the file type named `fileTypeName`
 * @param  {string}   fileTypeName the file type name
 * @return {Compiler}              the compiler for the file type named `fileTypeName`
 */
exports.getCompilerForFileType = function (fileTypeName) {
    return exports.compilers[fileTypesManager.fileTypes[fileTypeName].compiler];
};

/**
 * Get Default Options Of All Compilers
 * @return {object} the default settings for all compilers
 */
exports.getDefaultOptions = function () {
    var settings = {},
        compilers = exports.compilers;
    for (var k in compilers) {
        if (compilers[k].options.length) {
            settings[k] = getSettings(compilers[k]);    
        }
    }
    return settings;
};

/**
 * Compile File
 * @param {object}   file    file object
 * @param {function} success success callback
 * @param {function} fail fail callback
 */
exports.compileFile = function (file, success, fail) {
    if (!fs.existsSync(path.dirname(file.output))) {
        fs.mkdirpSync(path.dirname(file.output));
    }

    exports.getCompilerForFileType(file.type).compile(file, success, fail);
};

// init
// loadBuiltInCompilers();
