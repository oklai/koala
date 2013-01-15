//watch file api

'use strict';

var fs = require('fs'),
	path = require('path'),
	compiler = require('./compiler.js');

var watchedCollection = {},//全局监听文件集合
	importsCollection = {};//全局import文件集合

//add watch file or files
exports.add = function(file) {
	if(Array.isArray(file)){
		file.forEach(function(item) {
			watchFile(item);
		});
	}else{
		watchFile(file);
	}
}

//remove watch file or files
exports.remove = function(file) {
	if(Array.isArray(file)){
		file.forEach(function(item) {
			unwatchFile(item);
		});
	}else{
		unwatchFile(file);
	}
}

//update watch file or files
exports.update = function(file) {
	if (Array.isArray(file)) {
		file.forEach(function(item) {
			unwatchFile(item.src);
			watchFile(item);
		});
	} else {
		unwatchFile(file.src);
		watchFile(file);
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
}

//获取已在监听中的文件
exports.getWatchedCollection = function() {
	return watchedCollection;
};

//watch file
function watchFile(file) {
	if (watchedCollection[file.src]) {
		fs.unwatchFile(file.src);
		return false;
	}

	fs.watchFile(file.src, {interval: 1000}, function(curr){
		if (curr.mode === 0) return false;

		//文件改变，编译
		compiler.runCompile(file);
	});

	watchedCollection[file.src] = file;
}

//unwatch file
function unwatchFile(src) {
	fs.unwatchFile(src);
	delete watchedCollection[src];
}

//监听import文件,改变时编译所以引用了他的文件
function watchImport(src) {
	//取消之前的监听事件
	var complileSelf = false;
	if (watchedCollection[src]) {
		fs.unwatchFile(src);
		complileSelf = true;
	}

	fs.watchFile(src, {interval: 1000}, function(curr) {
		if (curr.mode === 0) return false;
		
		//编译自身
		if (complileSelf) compiler.runCompile(watchedCollection[src]);

		//编译父文件
		var imported = importsCollection[src];
		imported.forEach(function(file) {
			//仅当文件在监听列表中时执行
			if (watchedCollection[file.src]) {
				compiler.runCompile(file);
			}
		});
	});
}