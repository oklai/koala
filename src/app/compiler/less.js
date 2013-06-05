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

	//compile file by system command
	if (appConfig.systemCommand.less) {
		compileBySystemCommand({
			parseOpts: parseOpts,
			compressOpts: compressOpts,
			output: output
		}, success, fail);
		return false;
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
				addImports(parser.imports, filePath);
				
			}catch(e) {
				if (fail) fail();
				notifier.throwLessError(filePath, e);
			}
		});

	});
}

/**
 * compile file by system command
 * @param  {Object} options compile options
 */
function compileBySystemCommand (options, success, fail) {
	var parseOpts = options.parseOpts;
	var filePath = parseOpts.filename,
		argv = [];

	argv.push('"' + filePath + '"');
	argv.push('"' + options.output + '"');

	//--compress, --yui-compress
	if (options.compressOpts.compress) {
		argv.push('--compress');
	}
	if (options.compressOpts.yuicompress) {
		argv.push('--yui-compress');
	}

	//--line-numbers=TYPE (comments, mediaquery, all)
	if (parseOpts.dumpLineNumbers) {
		argv.push('--line-numbers=' + parseOpts.dumpLineNumbers);
	}

	argv.push('--no-color');

	exec('lessc ' + argv.join(' '), {timeout: 5000}, function(error, stdout, stderr){
		if (error !== null) {
			if (fail) fail();
			notifier.throwError(stderr, filePath);
		} else {
			if (success) success();

			//add watch imports
			var code = fs.readFileSync(filePath, 'utf8');
			var imports = getImports(code, filePath);
			addImports(imports, filePath);
		}
	});
}

/**
 * get import file
 * @param  {String} code code content
 * @return {Array}  import list
 */
function getImports(code, srcFile) {
	code = code.replace(/\/\*[\s\S]+?\*\/|[\r\n\t]+\/\/.*/g, '');
	var reg = /@import\s+[\"\']([^\.]+?|.+?less)[\"\']/g
	var result, imports = [];
	while ((result = reg.exec(code)) !== null ) {
	  imports.push(result[1]);
	}

	var dirname = path.dirname(srcFile), extname = path.extname(srcFile);
	imports = imports.map(function (item) {
		if (path.extname(item) !== extname) {
			item += extname;
		}
		return path.resolve(dirname, item);
	});
	
	return imports;
}

/**
 * add watch import file
 * @param {Object} importsObject imports Object
 * @param {String} srcFile       source file
 */
function addImports(importsObject, srcFile) {
	var importsFiles = [];

	if (Array.isArray(importsObject)) {
		importsFiles = importsObject;
	} else {
		for (var k in importsObject.files) {
			importsFiles.push(k);
		}
	}
	
	fileWatcher.addImports(importsFiles, srcFile);
}

module.exports = lessCompiler;