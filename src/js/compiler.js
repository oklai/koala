//代码编译模块

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

//编译文件
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
	global.debug('compile runCompile');
}

//less 编译
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
				var importsFiles = parser.imports.files;
				if (!common.isEmptyObject(importsFiles)) {
					addImports(importsFiles, parser.imports.paths, file);
				}

			}catch(e) {
				notifier.throwLessError(e);
			}
		});

	});
}

//监听less import文件
function addImports(filesObject, paths, srcFile) {
	var files = [];
	for (var k in filesObject) files.push(k);

	if (files.length === 0) return false;

	paths = paths.filter(function(item) {
		return item !== '.';
	});

	fileWatcher.addImports(files, paths, srcFile);
}

//coffeescript 编译
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


//sass 编译
var sassCmd;
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