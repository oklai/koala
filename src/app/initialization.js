/**
 * 程序初始化
 */

var appConfig      = require('./appConfig.js'),
	storage        = require('./storage.js'),
	jadeManager    = require('./jadeManager.js'),
	fileWatcher    = require('./fileWatcher.js'),
	projectManager = require('./projectManager.js'),
	notifier       = require('./notifier.js'),
	$              = global.jQuery;

//just for debug
global.appConfig = appConfig;
global.storage = storage;
global.fileWatcher = fileWatcher;
global.notifier = notifier;
global.projectManager = projectManager;

//渲染主界面
function renderProjects() {
	projectManager.checkStatus();//检查项目的有效性

	var projectsDb = storage.getProjects(),
		projectsList = [],
		lastActiveProjectId = storage.getHistoryDb().activeProject,
		activeProjectFiles = [];

	//遍历数据
	//项目列表
	for(var k in projectsDb){
		projectsList.push(projectsDb[k]);
	}

	//load prev active project files
	if (lastActiveProjectId) {
		var activeProject = projectsDb[lastActiveProjectId];
		//active文件列表
		for(k in activeProject.files){
			activeProjectFiles.push(activeProject.files[k])
		}
	}

	//render page
	if (projectsList.length > 0) {
		var foldersHtml = jadeManager.renderFolders(projectsList);
		$('#folders').html(foldersHtml);
	}

	if (activeProjectFiles.length > 0) {
		var filesHtml = jadeManager.renderFiles(activeProjectFiles);
		$('#files ul').html(filesHtml);
	}

	//trigger active project
	global.activeProject = lastActiveProjectId;
	$('#' + lastActiveProjectId).addClass('active');

	//show main window
	global.mainWindow.show();
}

//读取并监听项目文件
function startWatchProjects() {
	//获取文件列表
	var projectsDb = storage.getProjects(),
		compileFiles = [];

	for(var k in projectsDb){
		var filsItem = projectsDb[k].files;
		for(var j in filsItem){
			if (filsItem[j].compile) {
				compileFiles.push({
					pid: k,
					src: filsItem[j].src
				});
			}
		}
	}

	if(compileFiles.length > 0) {
		//监视文件改动
		fileWatcher.add(compileFiles);
	}
}

//读取并监听import文件
function startWatchImports () {
	var importsDb = storage.getImportsDb(),
		fileList = [];
	for (var k in importsDb) {
		fileList.push(k);
	}

	fileWatcher.setImportsCollection(importsDb);
	
	if (fileList.length > 0) {
		fileWatcher.watchImport(fileList);
	}
}

exports.init = function() {
	//Add error event listener
	process.on('uncaughtException', function(e) {
		global.mainWindow.show();
		notifier.throwAppError(e.stack);
	});
	
	//渲染页面
	renderProjects();

	//延迟执行
	setTimeout(function() {
		//执行监听
		startWatchProjects();
		startWatchImports();

		//窗口事件
		require('./windowEvents.js').init();

		//测试启动时间
		global.endTime = new Date();
	}, 3000);
}