/**
 * compiler index
 */

'use strict';

var fs          = require('fs'),
	path        = require('path'),
	util        = require('../util.js');

var lessCompile   = require('./less.js'),
	sassCompile   = require('./sass.js'),
	compassCompile= require('./compass.js'),
	coffeeCompile = require('./coffeescript.js');

/**
 * run compile
 * @param  {Object} file    compile file object
 * @param  {Function} success compile success calback
 * @param  {Function} fail    compile fail callback
 */
exports.runCompile = function(file, success, fail) {
	var fileType = path.extname(file.src),
		output_dir = path.dirname(file.output);

	//create output dir if it's not exists
	if (!fs.existsSync(output_dir)) {
		util.mkdirpSync(output_dir);
	}

	if(fileType === '.less') {
		lessCompile(file, success, fail);
	}
	if(fileType === '.coffee') {
		coffeeCompile(file, success, fail);
	}
	if(/.sass|.scss/.test(fileType)) {
		if (file.settings.compass) {
			compassCompile(file, success, fail);
		} else {
			sassCompile(file, success, fail);	
		}
	}
}

