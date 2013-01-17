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

var projectsDb = storage.getProjects();//项目集合

//添加项目
exports.addProject = function(src, callback) {
	//检查目录是否已存在
	if(checkProjectExists(src)) {
		notifier.alert('该目录已存在，无需重复添加。');
		return false;
	}

	var id = common.createRdStr(),
		project = {
		id: id,
		name: src.split(path.sep).slice(-1)[0],
		src: src,
		files: getFilesOfDirectory(src)
	}

	//保存
	projectsDb[id] = project;
	storage.updateJsonDb();

	//监视文件
	var fileList = [],
		pid = project.id;
	for(var k in project.files) {
		fileList.push({
			pid: pid,
			src: k
		});
	}
	fileWatcher.add(fileList);

	if(callback) callback(project);
}

//删除项目
exports.deleteProject = function(id, callback) {
	var fileList = [],
		project = projectsDb[id];

	for(var k  in project.files) fileList.push(k);

	fileWatcher.remove(fileList);	//取消对文件的监视

	delete projectsDb[id];
	storage.updateJsonDb();

	if(callback) callback();
}

//检查项目目录状态，是否已删除
exports.checkStatus = function() {
	var hasChanged = false;

	for (var k in projectsDb) {
		//目录不存在，删除该项目
		if (!fs.existsSync(projectsDb[k].src)) {
			delete projectsDb[k];
			hasChanged = true;
			continue;
		}

		//检查文件
		for (var j in projectsDb[k].files) {
			var fileSrc = projectsDb[k].files[j].src;
			//文件不存在，剔除文件
			if (!fs.existsSync(fileSrc)) {
				hasChanged = true;
				delete projectsDb[k].files[j];
			}
		}
	}

	//若发生改变，重新保存数据
	if (hasChanged) {
		storage.updateJsonDb();
	}
}

//刷新目录
exports.refreshProject = function (id, callback) {
	var project = projectsDb[id],
		src = project.src,
		files = project.files,
		pid = project.id,
		hasChanged = false,
		invalidFiles = [];

	//检查文件是否已删除
	for (var k in files) {
		var fileSrc = files[k].src;
		//文件不存在，剔除文件
		if (!fs.existsSync(fileSrc)) {
			invalidFiles.push(fileSrc);
			delete files[k];
			hasChanged = true;
		}
	}

	//添加新增文件
	var fileList = walkDirectory(src),
		newFiles = [];
	fileList.forEach(function(item) {
		if (!files.hasOwnProperty(item)) {
			var model = {
				id: common.createRdStr(),
				type: path.extname(item).replace('.', ''),
				name: path.basename(item),
				src: item,
				output: getDefaultOutput(item),
				settings: {}
			}
			files[item] = model;
			newFiles.push({
				pid: pid,
				src: item
			});
			hasChanged = true;
		}
	});

	if (hasChanged) storage.updateJsonDb();

	if (invalidFiles.length > 0) fileWatcher.remove(invalidFiles);

	if (newFiles.length > 0) fileWatcher.add(newFiles);

	if (callback) callback(files);
}

/**
 * 更新文件设置
 * @param  {String}   pid      所属项目ID
 * @param  {Object}   file     文件对象
 * @param  {Function} callback 回调函数
 */
exports.updateFile = function(pid, file, callback) {
	projectsDb[pid].files[file.src] = file;
	storage.updateJsonDb();

	//更新监视、编译方式
	fileWatcher.update(file);

	if (callback) callback();
}

/**
 * 取消自动编译
 * @param  {String}   fileSrc  文件地址
 * @param  {Function} callback 回调函数
 */
exports.disableFileCompile = function(fileSrc, callback) {
	var watchedCollection = fileWatcher.getWatchedCollection();
	delete watchedCollection[fileSrc];
	if (callback) callback();
};


/**
 * 激活自动编译
 * @param  {String}   pid      所属项目ID
 * @param  {String}   fileSrc  文件地址
 * @param  {Function} callback 回调函数
 */
exports.enableFileCompile = function(pid, fileSrc, callback) {
	fileWatcher.add({
		pid: pid,
		src: fileSrc
	});
	if (callback) callback();
};

//检测目录是否已存在
function checkProjectExists(src) {
	var projectItems = [],
		exists = false;
	
	for(var k in projectsDb) {
		projectItems.push(projectsDb[k]);
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
	
	files.forEach(function(item){
		var model = {
			id: common.createRdStr(),
			type: path.extname(item).replace('.', ''),
			name: path.basename(item),
			src: item,
			output: getDefaultOutput(item),
			settings: {}
		}

		filesObject[item] = model;
	});

	return filesObject;
}

/**
 * 遍历目录，获取该目录所有匹配文件
 * @param  {String} root 目录地址
 * @return {Array} 
 */
function walkDirectory(root){
	var files = [];

	function walk(dir) {
		var dirList = fs.readdirSync(dir);
		dirList.forEach(function(item){
			if(fs.statSync(dir + path.sep + item).isDirectory()){
				walk(dir + path.sep + item);
			}else{
				files.push(dir + path.sep + item);
			}
		});
	}
	
	walk(root);
	return files.filter(isValidFile);
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

