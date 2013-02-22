/**
 * 代码编译模块
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
 * 执行编译
 * @param  {Object} file 文件对象
 */
exports.runCompile = function(file, callback) {
	var fileType = path.extname(file.src);
	if(fileType === '.less') {
		lessCompile(file, callback);
	}
	if(fileType === '.coffee') {
		coffeeCompile(file, callback);
	}
	if(/.sass|.scss/.test(fileType)) {
		sassCompile(file, callback);
	}
	global.debug('compile ' + file.src);
}

/**
 * less 编译
 * @param  {Object} file 文件对象
 */
function lessCompile(file, callback){
	var filePath = file.src,
		output = file.output,
		settings = file.settings || {},
		defaultOpt = appConfig.less,
		compressOpts = {
			compress: defaultOpt.compress,
			yuicompress: defaultOpt.yuicompress,
		};

	if (/compress|yuicompress/.test(settings.outputStyle)) {
		compressOpts[settings.outputStyle] = true;
	}

	var parseOpts = {
		paths: [path.dirname(filePath)],
		filename: filePath,
		optimization: 1,
		rootpath: '',	                // a path to add on to the start of every url resource
		relativeUrls: false,
		strictImports: false
		//dumpLineNumbers: "comments"	// or "mediaQuery" or "all"
	};

	//读取代码内容
	fs.readFile(filePath, 'utf8', function(rErr, code) {
		if(rErr) {
			notifier.throwGeneralError(rErr.message);
			return false;
		}

		var parser = new(less.Parser)(parseOpts);
		parser.parse(code, function(e, tree) {
			if(e) {
				notifier.throwLessError(e);
				return false;
			}

			try {
				var css = tree.toCSS(compressOpts);

				//写入文件
				fs.writeFile(output, css, 'utf8', function(wErr) {
					if(wErr) {
						notifier.throwGeneralError(wErr.message);
					} else {
						//输出日志
						notifier.createCompileLog(file, 'less');
						if (callback) callback();
					}
				});

				//添加监听import文件
				addLessImports(parser.imports, filePath);

			}catch(e) {
				notifier.throwLessError(e);
			}
		});

	});
}

/**
 * 添加less import文件
 * @param {Object} importsObject less imports对象
 * @param {String} srcFile       imports 所在文件
 */
function addLessImports(importsObject, srcFile) {
	var importsFilesObj = importsObject.files,
		importsPaths = importsObject.paths,
		importsFiles = [];

	if (importsFilesObj) {
		for (var k in importsFilesObj) importsFiles.push(k);
	}

	importsPaths = importsPaths.filter(function(item) {
		return item !== '.';
	});

	importsFiles = importsFiles.map(function(item) {
		var realPath = '';
		for(var i = 0; i < importsPaths.length; i++) {
			var fileName = importsPaths[i] + path.sep + item;
			if (fs.existsSync(fileName)) {
				realPath = fileName;
				break;
			}
		}
		return realPath;
	});

	fileWatcher.addImports(importsFiles, srcFile);
}

/**
 * coffeescript 编译
 * @param  {Object} file 文件对象
 */
function coffeeCompile(file, callback) {
	var filePath = file.src,
		output = file.output,
		javascript;

	var settings = file.settings;
	for (var k in appConfig.coffeescript) {
		if (!settings.hasOwnProperty(k)) {
			settings[k] = appConfig.coffeescript[k];
		}
	}

	//读取代码内容
	fs.readFile(filePath, 'utf8', function(rErr, code) {
		if(rErr) {
			notifier.throwGeneralError(rErr.message);
			return false;
		}

		try{
			javascript = coffee.compile(code, {
				bare: settings.bare,
				lint: settings.lint
			});
			//写入文件
			fs.writeFile(output, javascript, 'utf8', function(wErr) {
				if(wErr) {
					notifier.throwGeneralError(wErr.message);
				} else {
					//输出日志
					notifier.createCompileLog(file, 'coffee');
					if (callback) callback();
				}
			});
		} catch (err) {
			//compile error
			notifier.throwCoffeeScriptError(file.src, err.message);
		}
	});
}


/**
 * sass 编译
 */
var sassCmd;//sass命令缓存变量
/**
 * 获取sass命令
 * @return {String}
 */
function getSassCmd() {
	var binDir = path.resolve(),
		jruby = binDir + '/bin/jruby.jar',
		sass = binDir + '/bin/sass',
		command = [];

	if (appConfig.rubyEnable) {
		command.push('ruby -S');
	} else {
		command.push('java -jar', jruby, '-S')
	}
	command.push(sass);
	command = command.join(' ');
	sassCmd = command;
	return command;
}

/**
 * 执行sass编译
 * @param  {Object} file 文件对象
 */
function sassCompile(file, callback) {
	//未安装java
	if (!appConfig.javaEnable && !appConfig.rubyEnable) {
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

	//执行sass命令行
	var argv = [filePath, output, '--style', settings.outputStyle, '--load-path', loadPath];

	if (settings.compass) {
		argv.push('--compass');
	}

	if (settings.lineComments) {
		argv.push('--line-comments');
	}

	if (settings.unixNewlines) {
		argv.push('--unix-newlines');
	}

	var command = sassCmd || getSassCmd();
		command += ' ' + argv.join(' ');

	exec(command, {timeout: 5000}, function(error, stdout, stderr){
		if (error !== null) {
			global.debug(command);
			global.debug(error.message);
			notifier.throwSassError(filePath, error.message);
		} else {
			//输出日志
			notifier.createCompileLog(file, 'sass');
			if (callback) callback();

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