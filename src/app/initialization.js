/**
 * 程序初始化
 */

var storage = require('./storage.js'),
	jadeManager =  require('./jadeManager.js'),
	fileWatcher = require('./fileWatcher.js'),
	projectManager = require('./projectManager.js'),
	notifier = require('./notifier.js'),
	mainDocument = global.mainWindow.window.document,
	$ = global.jQuery;

//Add error event listener
process.on('uncaughtException', function(e) {
	notifier.throwAppError(e.stack);
});

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

//开始监听文件
function startWatch() {
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

exports.init = function() {
	renderPage();
	startWatch();
}