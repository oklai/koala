/**
 * compilers manager module
 */

'use strict';

var fs          = require('fs-extra'),
    path        = require('path'),
    util        = require('./util.js'),
    Compiler    = require('./Compiler.js'),
    FileManager = require('./FileManager.js'),
    fileTypesManager = require('./fileTypesManager.js');

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
	})
	return settings;
}

/**
 * Load Built-in Compilers
 */
var loadBuiltInCompilers = function () {
	var appExtensionsDir = FileManager.appExtensionsDir,
		packagePath = path.join(appExtensionsDir, 'package.json'),
		packageData = util.readJsonSync(packagePath),
		compilers = {},
		fileTypes = {};

	packageData.forEach(function (item) {
		// get file type of compiler
		item.file_types.forEach(function (type) {
			type.compiler = item.name;
			type.icon = path.resolve(appExtensionsDir, type.icon);
			type.watch = type.watch === false ? false : true; // default is true
			
			var exts = type.extension || type.extensions;
			exts = Array.isArray(exts) ? exts : [exts];
			exts.forEach(function (item) {
				fileTypes[item] = type;
			})
		});

		item.configPath = appExtensionsDir;

		// create compiler
		if (item.name === 'compass') {
			compilers.compass = new Compiler(item);
		} else {
			var CompilerClass = require(path.resolve(appExtensionsDir, item.main));
			compilers[item.name] = new CompilerClass(item);
		}
		global.debug(compilers[item.name])
	});

	// cache compilers
	exports.compilers = compilers;

	// cache fileTypes
	fileTypesManager.addFileType(fileTypes);
}

/**
 * Get Compilers
 * @return {object} compilers
 */
exports.getCompilers = function () {
	return exports.compilers;
}

/**
 * Get Compilers As A Array
 * @return {array} compilers
 */
exports.getCompilersAsArray = function () {
	var compilers = [];
	for (var k in exports.compilers) {
		compilers.push(exports.compilers[k]);
	}
	return compilers;
}

/**
 * Get Compiler By Name
 * @param  {string} name compiler name
 * @return {Object}      compiler object
 */
exports.getCompilerByName = function (name) {
	return exports.compilers[name];
}

/**
 * Get Default Options Of All Compilers
 * @return {[type]} [description]
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
}

/**
 * Merge Global Settings
 * @param  {string} compilerName   
 * @return {object} compilerSettings
 */
exports.getGlobalSettings = function (compilerName) {
	var configManager = require('./appConfigManager.js'),
		globalSettings = configManager.getGlobalSettingsOfCompiler(compilerName),
		// Clone Object
        compilerSettings =  JSON.parse(JSON.stringify(exports.getCompilerByName(compilerName)));

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
}

/**
 * Compile File
 * @param  {object} file    file object
 * @param  {object} handlers compile event handlers
 */
exports.compileFile0 = function (file, handlers) {
	if (!fs.existsSync(path.dirname(file.output))) {
		fs.mkdirpSync(path.dirname(file.output));
	}

	var compilerSettings = exports.getGlobalSettings(file.type),
		classPath = path.resolve(compilerSettings.configPath, compilerSettings.main),
		CompilerClass = require(classPath);

	new CompilerClass(compilerSettings).compile(file, handlers);
};

exports.compileFile = function (file, handlers) {
	if (!fs.existsSync(path.dirname(file.output))) {
		fs.mkdirpSync(path.dirname(file.output));
	}
	
	exports.getCompilerByName(file.type).compile(file, handlers);
};

// init
loadBuiltInCompilers();