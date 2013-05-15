/**
 * Sass compiler
 */

'use strict';

var fs          = require('fs'),
	path        = require('path'),
	exec        = require('child_process').exec,
	notifier    = require('../notifier.js'),
	appConfig   = require('../appConfig.js').getAppConfig(),
	fileWatcher = require('../fileWatcher.js'),
	il8n        = require('../il8n.js');

var sassCmd;	//cache sass command

/**
 * get sass command
 * @return {String}
 */
function getSassCmd() {
	if (appConfig.systemCommand.sass) {
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
 * get import file
 * @param  {String} code code content
 * @return {Array}  import list
 */
function getImports(code) {
	code = code.replace(/\/\/.+?[\r\t\n]/g, '').replace(/\/\*[\s\S]+?\*\//g, '');
	var reg = /@import\s+[\"\']([^\.]+?|.+?sass|.+?scss)[\"\']/g
	var result, imports = [];
	while ((result = reg.exec(code)) !== null ) {
	  imports.push(result[1]);
	}
	return imports;
}

/**
 * add watch sass imports
 * @param {Array} imports import file list
 * @param {String} srcFile target file
 */
function addImports(imports, srcFile) {
	var dirname = path.dirname(srcFile), extname = path.extname(srcFile);
	imports = imports.map(function (item) {
		if (path.extname(item) !== extname) {
			item += extname;
		}
		return path.resolve(dirname, item);
	});

	fileWatcher.addImports(imports, srcFile);
}

/**
 * compile sass & scss file
 * @param  {Object} file    compile file object
 * @param  {Function} success compile success calback
 * @param  {Function} fail    compile fail callback
 */
function sassCompile(file, success, fail) {
	//has no sass environment
	if (!appConfig.rubyAvailable) {
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
	var argv = ['"'+filePath+'"', '"'+output+'"', '--style', settings.outputStyle, '--load-path', '"'+loadPath+'"'];

	if (settings.compass) {
		argv.push('--compass');
	}

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

			//add watch sass imports
			var code = fs.readFileSync(filePath, 'utf8');
			var imports = getImports(code);
			addImports(imports, filePath);
		}
	});
}

module.exports = sassCompile;