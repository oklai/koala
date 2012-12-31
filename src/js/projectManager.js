//project manager

'use strict';

var path = require('path');
var storage = require('./storage.js');
var jadeManager =  require('./jadeManager.js');
var fileWatcher = require('./fileWatcher.js');

var projects = storage.getProjects();//项目集合

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

//更新文件设置
exports.updateFile = function(pid, file, callback) {
	projects[pid].files[file.id] = file;
	storage.updateJsonDb();

	//更新监视、编译方式
	fileWatcher.update(file);

	if(callback) callback();
}

//检测目录是否已存在
function checkIsExist(name, src) {
	var projects = storage.getProjects(),
		projectFolders = [];
	
	for(var k in projects) projectFolders.push(projects[k]);

	projectFolders.forEach(function(item) {
		if(item.name === name && item.src === src) {
			return true;
		}
	});

	return false;
}