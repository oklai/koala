//代码编译模块

"use strict";

var fs = require("fs");
var path = require("path");
var less = require("less");

var storage = require("./storage.js");

exports.start = function(){
	//获取文件列表
	var allProjects = storage.getProjects(),
		allFiles = [];

	for(var k in allProjects){
		var filsItem = allProjects[k].files;
		for(var j in filsItem){
			allFiles.push(filsItem[j]);
		}
	}

	if(allFiles.length === 0) return false;

	//监视文件改动
	watchFile(allFiles);
};

//监视文件改动
function watchFile(files){
	files.forEach(function(item){
		fs.watchFile(item.src, {interval: 1000}, function(curr){
			//文件改变，编译
			console.log(item.src + " is change");
			runCompile(item);
		});
	});
}

//编译文件
function runCompile(file){
	var fileType = path.extname(file.src);
	if(fileType === ".less") {
		complieByLess(file);
	}
}

//less编译器
function complieByLess(file){
	var filePath = file.src,
		output = file.output;

	var parser = new(less.Parser)({
		paths: [path.dirname(filePath)],
		filename: path.basename(filePath)
	});

	//读取代码内容
	fs.readFile(filePath, 'utf8', function(rErr, code) {
		if(rErr) {
			showSystemError(rErr);
			return false;
		}

		try {
			parser.parse(code, function(e, tree) {
				if(e) {
					e.filename = filePath;
					showLessCompileError(e);
					return false;
				}

				var css = tree.toCSS();

				//写入文件
				fs.writeFile(output, css, "utf8", function(wErr) {
					if(wErr) {
						showSystemError(wErr);
						return false;
					}

					//输出日志
					showCompileLog(file, "less");
				});
			});

		}catch(e) {

			if(e) {
				e.filename = filePath;
				showLessCompileError(e);
			}
		}

	});
}


//less编译错误反馈
function showLessCompileError(err) {
	var errorMsg =err.type + "Error: " + 
	err.message + " in " + err.filename + ":" + err.line + ":" + err.index + "\n";

	var line = err.line;
	for(var i = 0; i < err.extract.length; i++){
		var curLine = line + i - 1;
		errorMsg += curLine + " " + err.extract[i] + "\n";
	}

	console.log(errorMsg);
}

//显示系统报错
function showSystemError(err) {
	console.log(err);
}

//编译成功日志
function showCompileLog(file, type) {
	console.log(file.src + "编译成功！");
}