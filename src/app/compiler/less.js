/**
 * LESS compiler
 */

'use strict';

var fs          = require('fs'),
	path        = require('path'),
	exec        = require('child_process').exec,
	less        = require('less'),
	notifier    = require('../notifier.js'),
	appConfig   = require('../appConfig.js').getAppConfig(),
	fileWatcher = require('../fileWatcher.js');

/**
 * compile less file
 * @param  {Object} file    compile file object
 * @param  {Function} success compile success calback
 * @param  {Function} fail    compile fail callback
 */
function lessCompiler (file, success, fail){
	var filePath = file.src,
		output = file.output,
		settings = file.settings || {},
		defaultOpt = appConfig.less,
		compressOpts = {
			compress: defaultOpt.compress,
			yuicompress: defaultOpt.yuicompress,
		};

	if (!settings.outputStyle) {
		compressOpts = {
			compress: false,
			yuicompress: false,
		};
	} else if (/compress|yuicompress/.test(settings.outputStyle)) {
		compressOpts[settings.outputStyle] = true;
	}

	var parseOpts = {
		paths: [path.dirname(filePath)],
		filename: filePath,
		optimization: 1,
		rootpath: '',	                // a path to add on to the start of every url resource
		relativeUrls: false,
		strictImports: false
		//dumpLineNumbers: "comments"	//"comments" or "mediaquery" or "all"
	};

	//dumpLineNumbers
	if (settings.lineComments) {
		parseOpts.dumpLineNumbers = "comments";
	}
	if (settings.debugInfo) {
		parseOpts.dumpLineNumbers = "mediaquery";
	}
	if (settings.lineComments && settings.debugInfo) {
		parseOpts.dumpLineNumbers = "all";
	}

	//read code content
	fs.readFile(filePath, 'utf8', function(rErr, code) {
		if(rErr) {
			if (fail) fail();
			notifier.throwLessError(filePath, rErr);
			return false;
		}

		var parser = new(less.Parser)(parseOpts);
		parser.parse(code, function(e, tree) {
			if(e) {
				if (fail) fail();
				notifier.throwLessError(filePath, e);
				return false;
			}

			try {
				var css = tree.toCSS(compressOpts);

				if (settings.lineComments || settings.debugInfo) {
					var reg = parseOpts.paths[0] + path.sep;
						reg = reg.replace(/\\/g, '\\\\');
					css = css.replace(new RegExp(reg, 'g'), '');
				}

				//write css code into output
				fs.writeFile(output, css, 'utf8', function(wErr) {
					if(wErr) {
						notifier.throwLessError(filePath, wErr);
					} else {
						if (success) success();
					}
				});

				//add watch import file
				addLessImports(parser.imports, filePath);
				
			}catch(e) {
				if (fail) fail();
				notifier.throwLessError(filePath, e);
			}
		});

	});
}


/**
 * add watch import file
 * @param {Object} importsObject imports Object
 * @param {String} srcFile       source file
 */
function addLessImports(importsObject, srcFile) {
	var importsFiles = [];

	for (var k in importsObject.files) {
		importsFiles.push(k);
	}

	fileWatcher.addImports(importsFiles, srcFile);
}

module.exports = lessCompiler;