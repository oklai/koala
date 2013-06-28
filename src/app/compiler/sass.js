/**
 * Sass compiler
 */

'use strict';

var fs          = require('fs'),
	path        = require('path'),
	exec        = require('child_process').exec,
	projectDb   = require('../storage.js').getProjects(),
	notifier    = require('../notifier.js'),
	appConfig   = require('../appConfig.js').getAppConfig(),
	fileWatcher = require('../fileWatcher.js'),
	il8n        = require('../il8n.js'),
	compileUtil = require('./common.js');

var sassCmd;	//cache sass command

/**
 * get sass command
 * @return {String}
 */
function getSassCmd() {
	if (appConfig.useSystemCommand.sass) {
		return 'sass';
	}

	if (sassCmd) return sassCmd;

	var binDir = path.resolve(),
		sass = '"' + binDir + '/bin/sass' + '"',
		command = [];

	command.push('ruby -S');
	command.push(sass);
	command = command.join(' ');
	sassCmd = command;
	return command;
}

/**
 * compile sass & scss file
 * @param  {Object} file    compile file object
 * @param  {Function} success compile success calback
 * @param  {Function} fail    compile fail callback
 */
function sassCompile(file, success, fail) {
	//has no sass environment
	if (!appConfig.rubyAvailable && !appConfig.useSystemCommand.sass ) {
		if (fail) fail();
		var message = il8n.__('not found ruby runtime environment');
		notifier.throwError(message);
		return false;
	}

	var filePath = file.src,
		output = file.output,
		loadPath = path.dirname(filePath);

	var settings = file.settings;
	for (var k in appConfig.sass) {
		if (!settings.hasOwnProperty(k)) {
			settings[k] = appConfig.sass[k];
		}
	}

	//run sass compile command
	var argv = ['"'+filePath+'"', '"'+output+'"', '--load-path', '"'+loadPath+'"'];

	//apply project config
	var pcfg = projectDb[file.pid].config;

	//custom options
	var customOptions = pcfg.customOptions;
	if (Array.isArray(customOptions)) {
		customOptions = customOptions.filter(function (item) {
			return /--style|--line-comments|--debug-info|--unix-newlines/.test(item) === false;
		});
		argv = argv.concat(customOptions);
	}

	//include paths
	if (Array.isArray(pcfg.includePaths)) {
		pcfg.includePaths.forEach(function (item) {
			argv.push('--load-path "' + item + '"');
		});
	}

	//require libs
	if (Array.isArray(pcfg.requireLibs)) {
		pcfg.requireLibs.forEach(function (item) {
			argv.push('--require "' + item + '"');
		});
	}

	//apply file settings
	argv.push('--style ' + settings.outputStyle);
	if (settings.lineComments) {
		argv.push('--line-comments');
	}

	if (settings.debugInfo) {
		argv.push('--debug-info');
	}

	if (settings.unixNewlines) {
		argv.push('--unix-newlines');
	}

	if (process.platform === 'win32') {
		argv.push('--cache-location "' + path.dirname(process.execPath) + '\\.sass-cache"');
	}

	var command = getSassCmd();
		command += ' ' + argv.join(' ');

	exec(command, {timeout: 5000}, function(error, stdout, stderr){
		if (error !== null) {
			if (fail) fail();
			notifier.throwError(stderr, filePath);
		} else {
			if (success) success();

			//add watch import file
			var imports = compileUtil.getImports('sass', filePath);
			fileWatcher.addImports(imports, filePath);
		}
	});
}

module.exports = sassCompile;