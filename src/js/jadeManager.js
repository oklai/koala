//页面内容jade渲染模块

"use strict";

var jade = require("jade");
var fs = require("fs");

//渲染项目目录列表
exports.renderFolders  = function(data) {
	var foldersJade = fs.readFileSync("./jade/folders.jade");
	var fn = jade.compile(foldersJade);
	return fn({folders: data});
}

//渲染文件列表
exports.renderFiles  = function(data) {
	var filesJade = fs.readFileSync("./jade/files.jade");
	var fn = jade.compile(filesJade);
	return fn({files: data});
}