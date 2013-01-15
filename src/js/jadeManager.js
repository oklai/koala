//页面内容jade渲染模块

"use strict";

var jade = require("jade");
var fs = require("fs");

//渲染项目目录列表
var foldersJade
exports.renderFolders  = function(data) {
	if (!foldersJade) {
		foldersJade = fs.readFileSync("./jade/folders.jade");	
	}
	
	var fn = jade.compile(foldersJade);
	return fn({folders: data});
}

//渲染文件列表
var filesJade;
exports.renderFiles  = function(data) {
	if (!filesJade) {
		filesJade = fs.readFileSync("./jade/files.jade");
	}

	var fn = jade.compile(filesJade);
	return fn({files: data});
}