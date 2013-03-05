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
	util      = require('./util.js'),
	notifier    = require('./notifier.js'),
	$           = global.jQuery;

var projectsDb = storage.getProjects();//项目集合

/**
 * add project
 * @param {String}   src      folder src
 * @param {Function} callback callback function
 */
exports.addProject = function(src, callback) {
	var id = util.createRdStr(),
		project = {
		id: id,
		name: src.split(path.sep).slice(-1)[0],
		src: src,
		files: getFilesOfDirectory(src)
	}

	var fileList = [],
		pid = project.id;
	for(var k in project.files) {
		//set pid of file 
		project.files[k].pid = pid;

		fileList.push({
			pid: pid,
			src: k
		});
	}

	//save project
	projectsDb[id] = project;
	storage.updateJsonDb();

	//watch file change
	fileWatcher.add(fileList);

	if(callback) callback(project);
}

/**
 * delete project
 * @param  {String}   id       target project id
 * @param  {Function} callback callback function
 */
exports.deleteProject = function(id, callback) {
	var fileList = [],
		project = projectsDb[id];

	for(var k  in project.files) fileList.push(k);

	fileWatcher.remove(fileList);	//remove watch listener

	delete projectsDb[id];
	storage.updateJsonDb();

	if(callback) callback();
}

/**
 * update project folder
 * @param  {String}   id       project id
 * @param  {Function} callback callback function
 */
exports.refreshProject = function (id, callback) {
	var project = projectsDb[id],
		src = project.src,
		files = project.files,
		pid = id,
		hasChanged = false,
		invalidFiles = [],
		invalidFileIds = [];

	//Check whether the file has been deleted
	for (var k in files) {
		var fileSrc = files[k].src;
		//The file does not exist, removed files
		if (!fs.existsSync(fileSrc)) {
			invalidFiles.push(fileSrc);
			invalidFileIds.push(files[k].id);
			delete files[k];
			hasChanged = true;
		}
	}

	//Add new file
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

/**
 * Check the project directory state, whether it has been deleted
 */
exports.checkStatus = function() {
	var hasChanged = false;

	for (var k in projectsDb) {
		//The directory does not exist, delete the project
		if (!fs.existsSync(projectsDb[k].src)) {
			delete projectsDb[k];
			hasChanged = true;
			continue;
		}

		//Check the file
		for (var j in projectsDb[k].files) {
			var fileSrc = projectsDb[k].files[j].src;
			//The file does not exist, removed files
			if (!fs.existsSync(fileSrc)) {
				hasChanged = true;
				delete projectsDb[k].files[j];
			}
		}
	}

	//If changed, re-save data
	if (hasChanged) {
		storage.updateJsonDb();
	}
}

/**
 * Update file settings
 * @param  {String}   pid          project ID
 * @param  {String}   fileSrc	   File path
 * @param  {Object}   changeValue  Change value
 * @param  {Function} callback     callback
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

	//Update watch Listener
	fileWatcher.update({
		pid: pid,
		src: fileSrc
	});

	if (callback) callback();
}

/**
 * Detect directory already exists
 * @param  {String} src File Path
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
 * Create File Object
 * @param  {String} fileSrc  File Path
 * @return {Object} File Object
 */
function creatFileObject(fileSrc) {
	var realType = path.extname(fileSrc).replace('.', ''),
		settings = {},
		type = /sass|scss/.test(realType) ? 'sass' : realType;

	if (type === 'less') {
		for (var k in appConfig.less) {
			settings[k] = appConfig.less[k];
		}

		if (settings.compress) settings.outputStyle = 'compress';
		if (settings.yuicompress) settings.outputStyle = 'yuicompress';

		if (appConfig.lineComments) settings.lineComments = true;
		if (appConfig.debugInfo) settings.debugInfo = true;
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
		id: util.createRdStr(),							//ID				
		pid: '',										//Project ID
		type: realType,									//Type
		name: path.basename(fileSrc),					//Name
		src: fileSrc,									//Path
		output: getDefaultOutput(fileSrc),				//Output Path
		compile: true,									//if automatically compile
		settings: settings								//settings
	}
}

/**
 * Get a directory of all files, and returns a file object collection
 * @param  {String} src directory path
 * @return {Object}     file object collection
 */
function getFilesOfDirectory(src){
	var files = walkDirectory(src),
		filesObject = {};
	
	files.forEach(function(item){
		filesObject[item] = creatFileObject(item);
	});

	return filesObject;
}

/**
 * To directory traversal Get all matching files in the directory
 * @param  {String} root Directory Path
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


/**
 * Filter invalid file
 * @param  {String}  item array item
 * @return {Boolean} 
 */
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

/**
 * Get the default output file
 * @param  {String} input file path
 * @return {String}       output path
 */
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

