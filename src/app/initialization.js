/**
 * 程序初始化
 */

var appConfig = require('./appConfig.js'),
	storage = require('./storage.js'),
	jadeManager =  require('./jadeManager.js'),
	fileWatcher = require('./fileWatcher.js'),
	projectManager = require('./projectManager.js'),
	notifier = require('./notifier.js'),
	mainDocument = global.mainWindow.window.document,
	$ = global.jQuery;

//渲染主界面
function renderPage() {
	projectManager.checkStatus();//检查项目的有效性

	var projects = storage.getProjects(),
		projectsList = [],
		activeProjectFiles = [];

	//遍历数据
	//项目列表
	for(var k in projects){
		projectsList.push(projects[k]);
	}

	if(projectsList.length > 0){
		var activeProject = projectsList[0];
		activeProject.active = true;

		//文件列表
		for(k in activeProject.files){
			activeProjectFiles.push(activeProject.files[k])
		}
	}

	//渲染数据
	var foldersHtml = jadeManager.renderFolders(projectsList),
		filesHtml = jadeManager.renderFiles(activeProjectFiles);

	$('#folders', mainDocument).html(foldersHtml);
	$('#files ul', mainDocument).html(filesHtml);

	global.mainWindow.show();//显示主界面
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

	//初始化应用设置
	appConfig.init();

	//渲染页面
	renderPage();

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