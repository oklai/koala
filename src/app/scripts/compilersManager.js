/**
 * compilers manager module
 */

'use strict';

var fs        = require('fs'),
	path      = require('path'),
	util      = require('./util'),
	Compiler  = require('./Compiler'),
	compilers = {};

exports.loadCompilers = function () {
	// load compilers from compilers.json
	var compilersConfigString = fs.readFileSync(global.appRootPth + '/compilers.json', 'utf8'),
		compilersConfig = {};

	compilersConfigString = util.replaceJsonComments(compilersConfigString);
	try {
		compilersConfig = JSON.parse(compilersConfigString);
	} catch (e) {}

	compilersConfig.forEach(function (compilerConfig) {
		var compilerClass = require(global.appRootPth + '/compilers/' + compilerConfig.name + '/' + compilerConfig.class_name),
			compiler = new compilerClass(compilerConfig);
		compilers[compiler.name] = compiler;
	});
};

/**
 * get compilers
 * @return {Object} compilers
 */
exports.getCompilers = function () {
	return compilers;
};

/**
 * get compiler for the given file type, or null if not found.
 * @param  {String} fileType file type name.
 * @return {Object} compiler for the fileType, or null.
 */
exports.compilerForFileType = function (fileType) {
	var compilerName;
	for (compilerName in compilers) {
		if (compilers[compilerName].fileTypeNames.indexOf(fileType) !== -1) {
			return compilers[compilerName];
		}
	}

	return null;
};

/**
 * get default config
 * @return {Object} default config
 */
exports.getDefaultConfig = function () {
	var config = {useSystemCommand: {} },
		compilerName,
		compiler;
	for (compilerName in compilers) {
		compiler = compilers[compilerName];

		if (util.isEmpty(compiler.defaults)) {
			return;
		}

		config[compiler.name] = {};
		if (compiler.defaults.options) {
			for (var key in compiler.defaults.options) {
				config[compiler.name][key] = compiler.defaults.options[key];
			}
		}
		if (compiler.defaults.outputStyle !== undefined) {
			config[compiler.name].outputStyle = compiler.defaults.outputStyle;
		}
		config.useSystemCommand[compiler.name] = !!compiler.defaults.useSystemCommand;
	}
	return config;
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

	if (compilers.compass.accepts(file.extension) && file.settings.compass) {
		compilers.compass.compile(file, success, fail);
	} else {
		exports.compilerForFileType(file.type).compile(file, success, fail);
	}
};
