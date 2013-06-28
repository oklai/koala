/**
 * Compass compiler
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

var compassCmd;	//cache sass command

/**
 * get sass command
 * @return {String}
 */
function getCompassCmd(flag) {
	if (flag || appConfig.useSystemCommand.compass) {
		return 'compass';
	}

	if (compassCmd) return compassCmd;

	var binDir = path.resolve(),
		compass = '"' + binDir + '/bin/compass' + '"',
		command = [];

	command.push('ruby -S');
	command.push(compass);
	command = command.join(' ');
	compassCmd = command;
	return command;
}

/**
 * compile sass & scss file
 * @param  {Object} file    compile file object
 * @param  {Function} success compile success calback
 * @param  {Function} fail    compile fail callback
 */
function compassCompile(file, success, fail) {
	var projectConfig = projectDb[file.pid].config || {},
		projectDir = projectDb[file.pid].src,
		filePath = file.src,
		relativeFilePath = path.relative(projectDir, filePath),
		settings = file.settings;

	//has no sass environment
	if (!appConfig.rubyAvailable && !projectConfig.useSystemCommand && !appConfig.useSystemCommand.compass) {
		if (fail) fail();
		var message = il8n.__('not found ruby runtime environment');
		notifier.throwError(message);
		return false;
	}

	var argv = [
		'compile', '"' + relativeFilePath + '"',
		'--output-style', settings.outputStyle,
		];

	if (settings.lineComments === false) {
		argv.push('--no-line-comments');
	}

	if (settings.debugInfo) {
		argv.push('--debug-info');
	}

	var command = getCompassCmd(projectConfig.useSystemCommand) + ' ' + argv.join(' ');

	exec(command, {cwd: projectDir, timeout: 5000}, function(error, stdout, stderr){
		if (error !== null) {
			if (fail) fail();
			notifier.throwError(stderr || stdout, filePath);
		} else {
			if (success) success();

			//add watch import file
			var imports = compileUtil.getImports('sass', filePath);
			fileWatcher.addImports(imports, filePath);
		}
	});
}

module.exports = compassCompile;