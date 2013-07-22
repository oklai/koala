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
	var packagePath = path.join(fileManager.appExtensionsDir, 'package.json'),
		packageData = util.readJsonSync(packagePath),
		compilers = {},
		fileTypes = {};

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
	});

	exports.compilers = compilers;
	exports.fileTypes = fileTypes;
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
 * Get File Types
 * @return {object} file types
 */
exports.getFileTypes = function () {
	return exports.fileTypes;
}

/**
 * Get File Types As A Array
 * @return {array} file types
 */
exports.getFileTypesAsArray = function () {
	var fileTypes = [];
	for (var k in exports.fileTypes) {
		fileTypes.push(exports.fileTypes[k]);
	}
	return fileTypes;
}

/**
 * Get File Type Object By File Extension
 * @param  {string} ext file extension
 * @return {object}     file type
 */
exports.getFileTypeByExt = function (ext) {
	return exports.fileTypes[ext];
}

/**
 * Get Extensions
 * @return {array} extensions
 */
exports.getExtensions = function () {
	return Object.getOwnPropertyNames(exports.fileTypes);
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

/**
 * Get Extensions Of Category
 * @param  {string} category category name
 * @return {array}          extensions
 */
exports.getExtsByCategory = function (category) {
	var exts = [];

	for (var k in exports.fileTypes) {
		if (exports.fileTypes[k].category === category) {
			exts.push(k);
		}
	}
	
	return exts;
}

/**
 * Compile File
 * @param  {object} file    file object
 * @param  {function} success success callback
 * @param  {function} fail fail callback
 */
var compilerClasses = {}; // cache compiler class
exports.compileFile = function (file, success, fail) {
	if (!fs.existsSync(path.dirname(file.output))) {
		fs.mkdirpSync(path.dirname(file.output));
	}

	var type = file.type;
	if (!compilerClasses[type]) {
		var compiler = exports.compilers[type],
			classPath = path.resolve(compiler.configPath, compiler.main);

		compilerClasses[type] = require(classPath);
	}
	
	compilerClasses[type].compile(file, success, fail);
};

// init
loadBuiltInCompilers();