/**
 * compilers manager module
 */

'use strict';

var fs               = require('fs-extra'),
    path             = require('path'),
    util             = require('./util'),
    fileManager      = require('./FileManager'),
    fileTypesManager = require('./fileTypesManager');

exports.compilers = {};

/**
 * Get Default Settings
 * @param  {object} compiler
 * @return {object} Settings
 */
var getSettings = function (compiler, key) {
	var settings = {};
	compiler[key].forEach(function (item) {
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
		settings[k] = {
			options: {},
			advanced: {}
		};
		if (compilers[k].options && compilers[k].options.length) {
			settings[k].options = getSettings(compilers[k], "options");	
		}
		if (compilers[k].advanced && compilers[k].advanced.length) {
			settings[k].advanced = getSettings(compilers[k], "advanced");	
		}
    }
    return settings;
};

/**
 * Merge Global Settings
 * @param  {string} compilerName   
 * @return {object} compilerSettings
 */
exports.mergeGlobalSettings = function (compilerName) {
	var configManager    = require('./appConfigManager.js'),
		globalSettings   = configManager.getDefaultSettingsOfCompiler(compilerName),
        compilerSettings = util.clone(exports.getCompilerByName(compilerName));

    var options = {};
    compilerSettings.options.forEach(function (item) {
        options[item.name] = globalSettings.options[item.name];
    });
    compilerSettings.options = options;

    var advanced = {};
    compilerSettings.advanced.forEach(function (item) {
        advanced[item.name] = globalSettings.advanced[item.name];
    });
    compilerSettings.advanced = advanced;

    return compilerSettings;
};

/**
 * Compile File
 * @param {object}   file File object
 * @param {function} done Done callback
 */
exports.compileFile = function (file, done) {
    if (!fs.existsSync(path.dirname(file.output))) {
        fs.mkdirpSync(path.dirname(file.output));
    }

    exports.getCompilerForFileType(file.type).compile(file, done);
};
