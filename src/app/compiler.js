/**
 * compiler
 */

'use strict';

var fs          = require('fs'),
	path        = require('path'),
	exec        = require('child_process').exec,
	less        = require('less'),
	coffee      = require('coffee-script'),
	notifier    = require('./notifier.js'),
	appConfig   = require('./appConfig.js').getAppConfig(),
	fileWatcher = require('./fileWatcher.js'),
	il8n        = require('./il8n.js');

/**
 * run compile
 * @param  {Object} file    compile file object
 * @param  {Function} success compile success calback
 * @param  {Function} fail    compile fail callback
 */
exports.runCompile = function(file, success, fail) {
	var fileType = path.extname(file.src);
	if(fileType === '.less') {
		lessCompile(file, success, fail);
	}
	if(fileType === '.coffee') {
		coffeeCompile(file, success, fail);
	}
	if(/.sass|.scss/.test(fileType)) {
		sassCompile(file, success, fail);
	}
}

/**
 * compile less file
 * @param  {Object} file    compile file object
 * @param  {Function} success compile success calback
 * @param  {Function} fail    compile fail callback
 */
function lessCompile(file, success, fail){
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
			notifier.throwGeneralError(rErr.message);
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
					notifier.throwGeneralError(wErr.message);
				} else {
					if (success) success();
				}
			});
		} catch (err) {
			//compile error
			if (fail) fail();
			notifier.throwCoffeeScriptError(file.src, err.message);
		}
	});
}


/**
 * sass compiler
 */
var sassCmd;	//cache sass command

/**
 * get sass command
 * @return {String}
 */
function getSassCmd() {
	var binDir = path.resolve(),
		sass = binDir + '/bin/sass',
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
	if (!appConfig.rubyEnable) {
		if (fail) fail();
		var message = il8n.__('not found ruby runtime environment');
		notifier.throwGeneralError(message);
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
	var argv = [filePath, output, '--style', settings.outputStyle, '--load-path', loadPath];

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

	var command = sassCmd || getSassCmd();
		command += ' ' + argv.join(' ');

	exec(command, {timeout: 5000}, function(error, stdout, stderr){
		if (error !== null) {
			if (fail) fail();
			notifier.throwSassError(filePath, error.message);
		} else {
			if (success) success();

			//add watch sass imports
			var code = fs.readFileSync(filePath, 'utf8');
			var imports = getSassImports(code);
			addSassImports(imports, filePath);
		}
	});
}

/**
 * get import file
 * @param  {String} code code content
 * @return {Array}  import list
 */
function getSassImports(code) {
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
function addSassImports(imports, srcFile) {
	var dirname = path.dirname(srcFile), extname = path.extname(srcFile);
	imports = imports.map(function (item) {
		if (path.extname(item) !== extname) {
			item += extname;
		}
		return path.resolve(dirname, item);
	});

	fileWatcher.addImports(imports, srcFile);
}