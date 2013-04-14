/**
 * CoffeeScript compiler
 */

'use strict';

var fs          = require('fs'),
	path        = require('path'),
	exec        = require('child_process').exec,
	coffee      = require('coffee-script'),
	notifier    = require('../notifier.js'),
	appConfig   = require('../appConfig.js').getAppConfig();

/**
 * compile coffee file
 * @param  {Object} file    compile file object
 * @param  {Function} success compile success calback
 * @param  {Function} fail    compile fail callback
 */
function coffeeCompile(file, success, fail) {
	var filePath = file.src,
		output = file.output,
		javascript;

	var settings = file.settings;
	for (var k in appConfig.coffeescript) {
		if (!settings.hasOwnProperty(k)) {
			settings[k] = appConfig.coffeescript[k];
		}
	}

	//read code
	fs.readFile(filePath, 'utf8', function(rErr, code) {
		if(rErr) {
			if (fail) fail();
			notifier.throwError(rErr.message);
			return false;
		}

		try{
			javascript = coffee.compile(code, {
				bare: settings.bare,
				lint: settings.lint
			});
			//write output
			fs.writeFile(output, javascript, 'utf8', function(wErr) {
				if(wErr) {
					if (fail) fail();
					notifier.throwError(wErr.message);
				} else {
					if (success) success();
				}
			});
		} catch (err) {
			//compile error
			if (fail) fail();
			notifier.throwError(err.message, file.src);
		}
	});
}

module.exports = coffeeCompile;