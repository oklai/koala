/**
 * 代码编译模块
 */

'use strict';

var fs = require('fs'),
	path = require('path'),
	exec = require('child_process').exec,
	less = require('less'),
	coffee = require('coffee-script'),
	notifier = require('./notifier.js'),
	appConfig = require('./appConfig.js').getAppConfig(),
	fileWatcher = require('./fileWatcher.js'),
	common = require('./common.js');

/**
 * 执行编译
 * @param  {Object} file 文件对象
 */
exports.runCompile = function(file) {
	var fileType = path.extname(file.src);
	if(fileType === '.less') {
		lessCompile(file);
	}
	if(fileType === '.coffee') {
		coffeeCompile(file);
	}
	if(/.sass|.scss/.test(fileType)) {
		sassCompile(file);
	}
	global.debug('compile ' + file.src);
}

/**
 * less 编译
 * @param  {Object} file 文件对象
 */
function lessCompile(file){
	var filePath = file.src,
		output = file.output,
		settings = file.settings || {},
		compress = settings.compress || appConfig.less.compress;

	var parser = new(less.Parser)({
		paths: [path.dirname(filePath)],
		filename: filePath,
		optimization: 1,
		strictImports: false
	});

	//读取代码内容
	fs.readFile(filePath, 'utf8', function(rErr, code) {
		if(rErr) {
			notifier.throwGeneralError(rErr);
			return false;
		}

		parser.parse(code, function(e, tree) {
			if(e) {
				notifier.throwLessError(e);
				return false;
			}

			try {
				var css = tree.toCSS({compress: compress});

				//写入文件
				fs.writeFile(output, css, 'utf8', function(wErr) {
					if(wErr) {
						notifier.throwGeneralError(wErr);
					} else {
						//输出日志
						notifier.createCompileLog(file, 'less');
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
function coffeeCompile(file) {
	var filePath = file.src,
		output = file.output,
		settings = file.settings || {},
		option_bare = settings.bare || appConfig.coffeescript.bare || false,
		javascript;

	//读取代码内容
	fs.readFile(filePath, 'utf8', function(rErr, code) {
		if(rErr) {
			notifier.throwGeneralError(rErr);
			return false;
		}

		try{
			javascript = coffee.compile(code, {bare: option_bare});
			//写入文件
			fs.writeFile(output, javascript, 'utf8', function(wErr) {
				if(wErr) {
					notifier.throwGeneralError(wErr.message);
				} else {
					//输出日志
					notifier.createCompileLog(file, 'coffee');
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
function sassCompile(file) {
	//未安装java
	if (!appConfig.javaEnable && !appConfig.rubyEnable) {
		notifier.throwGeneralError('execute ruby or java command failed\n' + 'you need install ruby or java first.');
		return false;
	}

	var filePath = file.src,
		output = file.output,
		settings = file.settings || {},
		defaultOpt = appConfig.sass,
		outputStyle = settings.outputStyle || defaultOpt.outputStyle,
		loadPath = path.dirname(filePath),
		compass = settings.compass;

	//执行sass命令行
	var argv = [filePath, output, '--style', outputStyle, '--load-path', loadPath];

	if (compass) {
		argv.push('--compass');
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
		}
	});
}