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
	util        = require('./util.js'),
	notifier    = require('./notifier.js'),
	$           = global.jQuery;

var projectsDb = storage.getProjects();//项目集合

/**
 * add project
 * @param {String}   src      folder src
 * @param {Function} callback callback function
 */
exports.addProject = function(src, callback) {
	var projectId = util.createRdStr(),
		projectConfig = {
			inputDir: src,
			outputDir: src
		};

	//use user config for compass project
	function loadConfigRb (configRbPath) {
		var config = util.configrb2json(configRbPath);
		
		projectConfig.sass = {
			compass: true
		}
		if (config.output_style) {
			projectConfig.sass.outputStyle =  config.output_style.replace(':','');
		}

		if (config.line_comments !== undefined) {
			projectConfig.sass.lineComments = config.line_comments;
		}

		var root = path.dirname(configRbPath);
		var http_path = config.http_path.indexOf('/') === 0 ? root : path.resolve(root, config.http_path);
		projectConfig.inputDir = path.resolve(http_path, config.sass_dir);
		projectConfig.outputDir = path.resolve(http_path, config.css_dir);
	}

	if (fs.existsSync(src + '/config.rb')) {
		loadConfigRb(src + '/config.rb');
	}
	else if (fs.existsSync(src + '/sass/config.rb')) {
		loadConfigRb(src + '/sass/config.rb');
	}

	//get file list
	var fileList = walkDirectory(projectConfig.inputDir),
		projectFiles = {},
		watchList = [];
	
	fileList.forEach(function(item){
		var obj = creatFileObject(item, projectConfig);
		obj.pid = projectId;

		projectFiles[item] = obj;
		
		watchList.push({
			pid: projectId,
			src: item
		});
	}); 

	//save project
	var project = {
		id: projectId,
		name: src.split(path.sep).slice(-1)[0],
		src: src,
		config: projectConfig,
		files: projectFiles
	}
	projectsDb[projectId] = project;
	storage.updateJsonDb();

	//watch files
	fileWatcher.add(watchList);

	if (!fs.exists(projectConfig.outputDir)) {
		fs.mkdir(projectConfig.outputDir);
	}

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
		files = project.files,
		pid = id,
		hasChanged = false,
		invalidFiles = [],
		invalidFileIds = [],
		projectConfig = project.config;

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
	var fileList = walkDirectory(projectConfig.inputDir),
		newFiles = [],
		newFileInfoList = [];
	fileList.forEach(function(item) {
		if (!files.hasOwnProperty(item)) {
			var fileObj = creatFileObject(item, projectConfig);
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
 * remove file of the project
 * @param  {String} fileSrc target file src
 * @param  {String} pid     project id
 */
exports.removeFileItem = function (fileSrc, pid, callback) {
	fileWatcher.remove(fileSrc);
	delete projectsDb[pid].files[fileSrc];
	global.debug(projectsDb[pid])
	storage.updateJsonDb();
	callback && callback();
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
 * To directory traversal Get all matching files in the directory
 * @param  {String} root Directory Path
 * @return {Array} 
 */
function walkDirectory(root){
	var files = [];

	if (!fs.existsSync(root)) {
		return [];
	}

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
 * Create File Object
 * @param  {String} fileSrc  File Path
 * @param  {Object} config   User Project Config
 * @return {Object} File Object
 */
function creatFileObject(fileSrc, config) {
	var realType = path.extname(fileSrc).replace('.', ''),
		settings = {},
		type = /sass|scss/.test(realType) ? 'sass' : realType,
		output = getCompileOutput(fileSrc, config.inputDir, config.outputDir);

	if (type === 'less') {
		for (var k in appConfig.less) {
			settings[k] = appConfig.less[k];
		}

		if (settings.compress) settings.outputStyle = 'compress';
		if (settings.yuicompress) settings.outputStyle = 'yuicompress';
	}

	if (type === 'sass') {
		for (var j in appConfig.sass) {
			settings[j] = appConfig.sass[j];
		}
	}
	
	if (type === 'coffee') {
		for (var i in appConfig.coffeescript) {
			settings[i] = appConfig.coffeescript[i];
		}
	}

	//user project config
	['less', 'sass', 'coffeescript'].forEach(function (item) {
		if (config[item]) {
			for (var k in config[item]) {
				settings[k] = config[item][k];
			}
		}
	});

	return {
		id: util.createRdStr(),							//ID				
		pid: '',										//Project ID
		type: realType,									//Type
		name: path.basename(fileSrc),					//Name
		src: fileSrc,									//Path
		output: output,				                    //Output Path
		compile: true,									//if automatically compile
		settings: settings								//settings
	}
}

/**
 * Get file compile output path
 * @param  {String} fileSrc file path
 * @param  {String} inputDir input dir
 * @param  {String} outputDir output dir
 * @return {String} output path
 */
function getCompileOutput(fileSrc, inputDir, outputDir){
	var suffixs = {
		'.less': '.css',
		'.sass': '.css',
		'.scss': '.css',
		'.coffee': '.js'
	};

	var fileName = path.basename(fileSrc);
	var fileType = path.extname(fileName);
	var output = fileSrc.replace(fileType, suffixs[fileType]);

	if (inputDir !== outputDir) {
		output = output.replace(inputDir, outputDir);
	}
	return output;
}

