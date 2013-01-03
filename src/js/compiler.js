//代码编译模块

'use strict';

var fs = require('fs'),
	path = require('path'),
	less = require('less'),
	notifier = require('./notifier.js'),
	appConfig = require('./appConfig.js').getAppConfig();

//编译文件
exports.runCompile = function(file) {
	var fileType = path.extname(file.src);
	if(fileType === '.less') {
		lessComplie(file);
	}
}

function lessComplie(file){
	var filePath = file.src,
		output = file.output,
		compress = file.settings.compress || appConfig.less.compress;

	var parser = new(less.Parser)({
		paths: [path.dirname(filePath)],
		filename: filePath,
		optimization: 1,
		strictImports: false
	});

	//读取代码内容
	fs.readFile(filePath, 'utf8', function(rErr, code) {
		if(rErr) {
			notifier.showSystemError(rErr);
			return false;
		}

		parser.parse(code, function(e, tree) {
			if(e) {
				notifier.showLessError(e);
				return false;
			}
			
			try {
				var css = tree.toCSS({compress: compress});

				//写入文件
				fs.writeFile(output, css, 'utf8', function(wErr) {
					if(wErr) {
						notifier.showSystemError(wErr);
						return false;
					}

					//输出日志
					notifier.createCompileLog(file, 'less');
				});
			}catch(e) {
				notifier.showLessError(e);
			}
		});
	});
}