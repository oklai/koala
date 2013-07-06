/**
 * Dust compiler
 */

'use strict';

var fs          = require('fs'),
	path        = require('path'),
	exec        = require('child_process').exec,
	dust        = require('dustjs-linkedin'),
	notifier    = require('../notifier.js'),
	appConfig   = require('../appConfig.js').getAppConfig();

/**
 * compile dust file
 * @param  {Object} file    compile file object
 * @param  {Function} success compile success calback
 * @param  {Function} fail    compile fail callback
 */
function compile(file, success, fail) {
	//compile file by use system command
	if (appConfig.useSystemCommand.dust) {
		compileBySystemCommand(file, success, fail);
		return false;
	}

	var filePath = file.src,
		output = file.output,
		settings = file.settings || {},
		defaultOpt = appConfig.dust;

	//read code content
	fs.readFile(filePath, 'utf8', function(rErr, code) {
		if (rErr) {
			if (fail) fail();
			notifier.throwError(rErr.message, filePath);
			return false;
		}

		try {
			var jst = dust.compile(code, path.basename(filePath, '.dust'));

			//write jst code into output
			fs.writeFile(output, jst, 'utf8', function(wErr) {
				if (wErr) {
					notifier.throwError(wErr.message, filePath);
				} else {
					if (success) success();
				}
			});
		} catch(e) {
			if (fail) fail();
			notifier.throwError(e.message, filePath);
		}
	});
}

/**
 * compile file by system command
 * @param  {Object} options compile options
 */
function compileBySystemCommand(file, success, fail) {
	var filePath = file.src,
		output = file.output,
		settings = file.settings || {},
		defaultOpt = appConfig.dust,
		compressOpts = {};

	var argv = [];
	argv.push('-n="' + path.basename(filePath, '.dust') + '"');
	argv.push('"' + filePath + '"');
	argv.push('"' + output + '"');

	exec('dustc ' + argv.join(' '), {cwd: path.dirname(filePath), timeout: 5000}, function (error, stdout, stderr) {
		if (error !== null) {
			if (fail) fail();
			notifier.throwError(stderr, filePath);
		} else {
			if (success) success();
		}
	});
}

module.exports = compile;