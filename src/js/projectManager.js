//project manager

"use strict";

var path = require("path");
var storage = require("./storage.js");
var jadeManager =  require("./jadeManager.js");

//添加项目
exports.addProject = function(src, callback) {
	var name = src.split(path.sep).slice(-1)[0];

	if(checkIsExist(name, src)) return false;

	var project = {
		name: name,
		src: src
	}
	//保存
	storage.saveProject(project,function(item){
		if(callback) callback(item);
	});	
}

//删除项目
exports.deleteProject = function(id, callback) {
	storage.deleteProject(id);
	if(callback) callback();
}

//切换浏览目录
exports.browseProject = function(id, callback) {
	var projects = storage.getProjects(),
		files = projects[id].files,
		fileList = [],
		html = "";

	for(var k in files) {
		fileList.push(files[k])
	}

	if(fileList.length > 0) {
		html = jadeManager.renderFiles(files);
	}

	if(callback) callback(html);
}

//检测目录是否已存在
function checkIsExist(name, src) {
	var projects = storage.getProjects();
	projects.forEach(function(item) {
		if(item.name === name && item.src === src) {
			return true;
		}
	});
}