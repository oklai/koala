//代码编译模块

"use strict";

var fs = require("fs");
var path = require("path");
var less = require("less");
var notifier = require("./notifier.js");

//编译文件
exports.runCompile = function(file) {
	var fileType = path.extname(file.src);
	if(fileType === ".less") {
		complieLess(file);
	}
}

//less编译器
function complieLess(file){
	var filePath = file.src,
		output = file.output;

	var parser = new(less.Parser)({
		paths: [path.dirname(filePath)],
		filename: path.basename(filePath)
	});

	//读取代码内容
	fs.readFile(filePath, 'utf8', function(rErr, code) {
		if(rErr) {
			notifier.showSystemError(rErr);
			return false;
		}

		try {
			parser.parse(code, function(e, tree) {
				if(e) {
					e.filename = filePath;
					notifier.showLessError(e);
					return false;
				}

				var css = tree.toCSS();

				//写入文件
				fs.writeFile(output, css, "utf8", function(wErr) {
					if(wErr) {
						notifier.showSystemError(wErr);
						return false;
					}

					//输出日志
					notifier.createCompileLog(file, "less");
				});
			});

		}catch(e) {

			if(e) {
				e.filename = filePath;
				notifier.showLessError(e);
			}
		}

	});
}
