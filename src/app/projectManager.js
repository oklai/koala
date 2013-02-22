/**
 * project manager
 */

'use strict';

var path        = require('path'),
	fs          = require('fs'),
	storage     = require('./storage.js'),
	jadeManager =  require('./jadeManager.js'),
	fileWatcher = require('./fileWatcher.js'),
	appConfig   = require('./appConfig.js').getAppConfig(),
	common      = require('./common.js'),
	notifier    = require('./notifier.js'),
	$           = global.jQuery;

var projectsDb = storage.getProjects();//项目集合

//添加项目
exports.addProject = function(src, callback) {
	var id = common.createRdStr(),
		project = {
		id: id,
		name: src.split(path.sep).slice(-1)[0],
		src: src,
		files: getFilesOfDirectory(src)
	}

	//监视文件
	var fileList = [],
		pid = project.id;
	for(var k in project.files) {
		//set文件项目ID
		project.files[k].pid = pid;

		fileList.push({
			pid: pid,
			src: k
		});
	}

	//保存
	projectsDb[id] = project;
	storage.updateJsonDb();

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

//刷新目录
exports.refreshProject = function (id, callback) {
	var project = projectsDb[id],
		src = project.src,
		files = project.files,
		pid = id,
		hasChanged = false,
		invalidFiles = [],
		invalidFileIds = [];

	//检查文件是否已删除
	for (var k in files) {
		var fileSrc = files[k].src;
		//文件不存在，剔除文件
		if (!fs.existsSync(fileSrc)) {
			invalidFiles.push(fileSrc);
			invalidFileIds.push(files[k].id);
			delete files[k];
			hasChanged = true;
		}
	}

	//添加新增文件
	var fileList = walkDirectory(src),
		newFiles = [],
		newFileInfoList = [];
	fileList.forEach(function(item) {
		if (!files.hasOwnProperty(item)) {
			var fileObj = creatFileObject(item);
				fileObj.pid = pid;

			files[item] = fileObj;

			newFiles.push(fileObj);

			newFileInfoList.push({
				pid: pid,
				src: item
			});

			hasChanged = true;
		}
	});

	if (hasChanged) storage.updateJsonDb();

	if (invalidFiles.length > 0) fileWatcher.remove(invalidFiles);

	if (newFiles.length > 0) fileWatcher.add(newFileInfoList);

	if (callback) callback(invalidFileIds, newFiles);
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

/**
 * 更新文件设置
 * @param  {String}   pid          所属项目ID
 * @param  {String}   fileSrc	   文件路径
 * @param  {Object}   changeValue  改变的值
 * @param  {Function} callback     回调函数
 */
exports.updateFile = function(pid, fileSrc, changeValue, callback) {
	var target = projectsDb[pid].files[fileSrc];
	for (var k in changeValue) {
		if (k === 'settings') {
			target.settings = $.extend(target.settings, changeValue.settings);
		} else {
			target[k] = changeValue[k];
		}
	}
	//projectsDb[pid].files[fileSrc] = $.extend(projectsDb[pid].files[fileSrc], changeValue);

	//storage.updateJsonDb();

	//更新监视、编译方式
	fileWatcher.update({
		pid: pid,
		src: fileSrc
	});

	if (callback) callback();
}

/**
 * 检测目录是否已存在
 * @param  {String} src 文件路径
 * @return {Boolean}
 */
exports.checkProjectExists = function (src) {
	var projectItems = [],
		exists = false,
		id;
	
	for(var k in projectsDb) {
		projectItems.push(projectsDb[k]);
	}

	for (var i = 0; i < projectItems.length; i++) {
		if(projectItems[i].src === src) {
			exists = true;
			id = projectItems[i].id;
			break;
		}
	}

	return {
		exists: exists,
		id: id
	};
}

/**
 * 创建文件对象
 * @param  {String} fileSrc  文件地址
 * @return {Object} 文件对象
 */
function creatFileObject(fileSrc) {
	var realType = path.extname(fileSrc).replace('.', ''),
		settings = {},
		type = /sass|scss/.test(realType) ? 'sass' : realType;

	if (type === 'less') {
		for (var k in appConfig.less) {
			settings[k] = appConfig.less[k];
		}

		if (settings['compress']) settings.outputStyle = 'compress';
		if (settings['yuicompress']) settings.outputStyle = 'yuicompress';
	}

	if (type === 'sass') {
		for (var k in appConfig.sass) {
			settings[k] = appConfig.sass[k];
		}
	}
	
	if (type === 'coffee') {
		for (var k in appConfig.coffeescript) {
			settings[k] = appConfig.coffeescript[k];
		}
	}

	return {
		id: common.createRdStr(),						//文件ID				
		pid: '',										//文件项目ID
		type: realType,	//文件类型
		name: path.basename(fileSrc),					//文件名称
		src: fileSrc,									//文件路径
		output: getDefaultOutput(fileSrc),				//输出路径
		compile: true,									//是否自动编译
		settings: settings								//设置
	}
}

//获取目录下所有文件,返回file对象集合
function getFilesOfDirectory(src){
	var files = walkDirectory(src),
		filesObject = {};
	
	files.forEach(function(item){
		filesObject[item] = creatFileObject(item);
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

		for (var i = 0; i < dirList.length; i++) {
			var item = dirList[i];
			
			//过滤系统文件
			if (/^\./.test(item)) {
				continue;
			}

			if(fs.statSync(dir + path.sep + item).isDirectory()) {
				try {
					walk(dir + path.sep + item);
				} catch (e) {

				}
				
			} else {
				files.push(dir + path.sep + item);
			}
		}
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

