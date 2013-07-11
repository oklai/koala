/**
 * compilers manager module
 */

'use strict';

var fs     = require('fs'),
	path   = require('path'),
	util   = require('./util.js'),
	fileTypes = require('./fileTypesManager').getFileTypes(),
	Compiler = require('./Compiler');

exports.loadCompilers = function () {
	// load compilers from compilers.json
	var compilersString = fs.readFileSync(global.appRootPth + '/compilers.json', 'utf8'),
		compilers = {};

	compilersString = util.replaceJsonComments(compilersString);
	try {
		compilers = JSON.parse(compilersString);
	} catch (e) {
		return  compilers;
	}

	compilers.forEach(function (compiler) {
		var compilerClass = require(global.appRootPth + '/compilers/' + compiler.name + '/' + compiler.class_name);
		new compilerClass(compiler);
	});
};

/**
 * get compilers
 * @return {Array} compilers
 */
exports.getCompilers = function () {
	return Compiler.getCompilers();
};

/**
 * get compiler for the given file type, or null if not found.
 * @param  {String} fileType file type name.
 * @return {Object} compiler for the fileType, or null.
 */
exports.compilerForFileType = function (fileType) {
	return Compiler.compilerForFileType(fileType);
};

/**
 * get default config
 * @return {Object} default config
 */
exports.getDefaultConfig = function () {
	return Compiler.getDefaultConfig();
};

/**
 * run compile
 * @param  {Object} file    compile file object
 * @param  {Function} success compile success calback
 * @param  {Function} fail    compile fail callback
 */
exports.compileFile = function (file, success, fail) {
	var output_dir = path.dirname(file.output);

	//create output dir if it's not exists
	if (!fs.existsSync(output_dir)) {
		util.mkdirpSync(output_dir);
	}

	this.getCompilerForFileType(file.type).compile(file);
};
