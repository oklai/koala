//watch file api

'use strict';

var fs = require('fs'),
	path = require('path'),
	compiler = require('./compiler.js');

var watchedCollection = {},//全局监听文件集合
	importsCollection = {};//全局import文件集合

//add watch file or files
exports.add = function(files) {
	if(Array.isArray(files)){
		files.forEach(function(item) {
			watchFile(item);
		});
	}else{
		watchFile(files);
	}
}

//remove watch file or files
exports.remove = function(files) {
	if(Array.isArray(files)){
		files.forEach(function(item) {
			unwatchFile(item.src);
		});
	}else{
		unwatchFile(files.src);
	}
}

//update watch file or files
exports.update = function(files) {
	if (Array.isArray(files)) {
		files.forEach(function(item) {
			unwatchFile(item.src);
			watchFile(item);
		});
	} else {
		unwatchFile(files.src);
		watchFile(files);
	}
}

//添加import文件
exports.addImports = function(files, paths, srcFile) {
	files = files.map(function(item) {
		var realPath = '';

		for(var i = 0; i < paths.length; i++) {
			var fileName = paths[i] + path.sep + item;
			if (fs.existsSync(fileName)) {
				realPath = fileName;
				break;
			}
		}

		return realPath;
	});

	files.forEach(function(item) {
		if (Array.isArray(importsCollection[item])) {
			//已监听过该文件,直接添加源文件
			var isExists = importsCollection[item].some(function(element) {
				return element.src === srcFile.src;
			});

			if (!isExists) importsCollection[item].push(srcFile);
		} else {
			//新建对象
			importsCollection[item] = [srcFile];
			watchImport(item);
		}
	});

	global.debug(importsCollection);
}

//获取已在监听中的文件
exports.getWatchedCollection = function() {
	return watchedCollection;
};

//watch file
function watchFile(file) {
	fs.watchFile(file.src, {interval: 1000}, function(){
		//文件改变，编译
		compiler.runCompile(file);
	});

	watchedCollection[file.src] = true;
}

//unwatch file
function unwatchFile(src) {
	fs.unwatchFile(src);
	delete watchedCollection[src];
}

//监听import文件,改变时编译所以引用了他的文件
function watchImport(src) {
	if (watchedCollection[src]) return false;

	fs.watchFile(src, {interval: 1000}, function() {
		var imported = importsCollection[src];
		imported.forEach(function(file) {
			//仅当文件在监听列表中时执行
			if (watchedCollection[file.src]) {
				compiler.runCompile(file);
			}
		});
	});
	
	watchedCollection[src] = true;
}