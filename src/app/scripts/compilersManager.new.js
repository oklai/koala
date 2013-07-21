/**
 * compilers manager module
 */

'use strict';

var fs                   = require('fs-extra'),
    path                 = require('path'),
    util                 = require('./util'),
    fileManager          = require('./FileManager.js');

exports.compilers = {};

exports.fileTypes = {};

exports.extensions = [];

exports.commands = [];

exports.libraries = [];

/**
 * Get Default Settings
 * @param  {object} compiler
 * @return {object} Settings
 */
var getSettings = function (compiler) {
	var settings = {};
	compiler.options.forEach(function (item) {
		settings[item.name] = item.default;
	})
	return settings;
}

/**
 * Load Built-in Compilers
 */
var loadBuiltInCompilers = function () {
	var packagePath = path.join(fileManager.appExtensionsDir, 'package.new.json'),
		packageData = util.readJsonSync(packagePath),
		compilers = {},
		fileTypes = {},
		commands = [],
		libraries = [];

	packageData.forEach(function (item) {
		// get file type of compiler
		item.file_types.forEach(function (type) {
			type.compiler = item.name;
			type.icon = path.resolve(fileManager.appExtensionsDir, type.icon);
			fileTypes[type.extension] = type;
		});

		// cache compiler
		delete item.file_types;
		item.configPath = fileManager.appExtensionsDir;
		compilers[item.name] = item;

		// cache commands
		if (item.commands) {
			commands = commands.concat(item.commands);
		}

		// cache libs
		if (item.libs) {
			libraries = libraries.concat(item.libs);
		}
	});

	exports.compilers = compilers;
	exports.fileTypes = fileTypes;
	exports.extensions = Object.getOwnPropertyNames(fileTypes);
	exports.commands = commands;
	exports.libraries = libraries;
}

/**
 * Get Default Options Of All Compilers
 * @return {[type]} [description]
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
}

exports.getExtsByCategory = function (category) {
	var exts = [];

	for (var k in exports.fileTypes) {
		if (exports.fileTypes[k].category === category) {
			exts.push(k);
		}
	}
	
	return exts;
}

exports.compileFile = function (file, success, fail) {
	var compiler = exports.compilers[file.type],
		classPath = path.resolve(compiler.configPath, compiler.main);
	require(classPath).compile(file, success, fail);
};

// init
loadBuiltInCompilers();

['compilers', 'fileTypes', 'extensions', 'commands', 'libraries'].forEach(function (item) {
	global.debug(item);
	global.debug(exports[item]);
});
global.debug(exports.getDefaultOptions());