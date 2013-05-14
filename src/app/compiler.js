/**
 * compiler
 */

'use strict';

var fs          = require('fs'),
	path        = require('path'),
	util        = require('./util.js');

var lessCompiler   = require('./compiler/less.js'),
	sassCompiler   = require('./compiler/sass.js'),
	coffeeCompiler = require('./compiler/coffeescript.js');

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
		lessCompiler(file, success, fail);
	}
	if(fileType === '.coffee') {
		coffeeCompiler(file, success, fail);
	}
	if(/.sass|.scss/.test(fileType)) {
		sassCompiler(file, success, fail);
	}
}

