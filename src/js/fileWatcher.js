//watch file api

'use strict';

var fs = require('fs');
var common = require('./common.js');
var compiler = require('./compiler.js');

//add watch file or files
exports.add = function(files) {
	if(common.isArray(files)){
		files.forEach(function(item) {
			watchFile(item);
		});
	}else{
		watchFile(files);
	}
}

//remove watch file or files
exports.remove = function(files) {
	if(common.isArray(files)){
		files.forEach(function(item) {
			fs.unwatchFile(item.src);
		});
	}else{
		fs.unwatchFile(files.src);
	}
}

//update watch file or files
exports.update = function(files) {
	if (common.isArray(files)) {
		files.forEach(function(item) {
			fs.unwatchFile(item.src);
			watchFile(item);
		});
	} else {
		fs.unwatchFile(files.src);
		watchFile(files);
	}
}

//watch file
function watchFile(file) {
	console.log(file);
	fs.watchFile(file.src, {interval: 1000}, function(){
		//文件改变，编译
		compiler.runCompile(file);
	});
}