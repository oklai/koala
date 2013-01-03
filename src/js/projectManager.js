//project manager

'use strict';

var path = require('path'),
	fs = require('fs'),
	storage = require('./storage.js'),
	jadeManager =  require('./jadeManager.js'),
	fileWatcher = require('./fileWatcher.js'),
	appConfig = require('./appConfig.js').getAppConfig(),
	common = require('./common.js'),
	notifier = require('./notifier.js');

var projects = storage.getProjects();//项目集合

//添加项目
exports.addProject = function(src, callback) {
	//检查目录是否已存在
	if(checkProjectExists(src)) {
		notifier.alert('该目录已存在，无需重复添加。');
		return false;
	}

	var project = {
		id: common.createRdStr(),
		name: src.split(path.sep).slice(-1)[0],
		src: src,
		files: getFilesOfDirectory(src)
	}

	//保存
	storage.saveProject(project, function(item) {
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

//检查项目状态的风格的风格 
exports.checkStatus = function() {
	var hasChanged = false;

	for (var k in projects) {
		//目录不存在，删除该项目
		if (!fs.existsSync(projects[k].src)) {
			delete projects[k];
			hasChanged = true;
			continue;
		}

		//检查文件
		for (var j in projects[k].files) {
			var fileSrc = projects[k].files[j].src;
			//文件不存在，剔除文件
			if (!fs.existsSync(fileSrc)) {
				hasChanged = true;
				delete projects[k].files[j];
			}
		}
	}

	//若发生改变，重新保存数据
	if (hasChanged) {
		storage.updateJsonDb();
	}
}

//检测目录是否已存在
function checkProjectExists(src) {
	var projectItems = [],
		exists = false;
	
	for(var k in projects) {
		projectItems.push(projects[k]);
	}

	for (var i = 0; i < projectItems.length; i++) {
		if(projectItems[i].src === src) {
			exists = true;
			break;
		}
	}

	return exists;
}


//获取目录下所有文件,返回file对象集合
function getFilesOfDirectory(src){
	var files = walkDirectory(src),
		filesObject = {};

	//过滤无效文件
	files = files.filter(isValidFile);

	files.forEach(function(item){
		var id = common.createRdStr();
		var model = {
			id: id,
			type: path.extname(item).replace('.', ''),
			name: path.basename(item),
			src: item,
			output: getDefaultOutput(item),
			settings: {}
		}

		filesObject[id] = model;
	});

	return filesObject;
}

//遍历目录
function walkDirectory(root){
	var files = [],
		srcSlash = (process.platform == 'win32') ? '\\' : '/';	//区分不同系统的路径斜杠

	var dirList = fs.readdirSync(root);
	dirList.forEach(function(item){
		if(fs.statSync(root + srcSlash + item).isDirectory()){
			walkDirectory(root + srcSlash + item);
		}else{
			files.push(root + srcSlash + item);
		}
	});

	return files;
}

//无效文件过滤方法
function isValidFile(item) {
	var extensions = appConfig.extensions,
		filterExts = appConfig.filter;

	var type = path.extname(item),
		name = path.basename(item);

	var isInfilter = filterExts.some(function(k) {
		return name.indexOf(k) > -1;
	});

	if(isInfilter) return false;

	var isInExtensions = extensions.some(function(k) {
		return type.indexOf(k) > -1;
	});

	return isInExtensions;
}

//获取默认输出文件
function getDefaultOutput(input){
	var suffixs = {
		'.less': '.css',
		'.sass': '.css',
		'.scss': '.css',
		'.coffee': '.js'
	};

	var fileName = path.basename(input);
	var fileType = path.extname(fileName);

	return input.replace(fileType, suffixs[fileType]);
}

