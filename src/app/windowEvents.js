/**
 * window events
 */

var fs             = require('fs'),
	storage        = require('./storage.js'),
	fileWatcher    = require('./fileWatcher.js'),
	appConfig      = require('./appConfig.js').getAppConfig(),
	mainWindow     = global.mainWindow,
	sessionStorage = mainWindow.window.sessionStorage,
	$              = global.jQuery;

/**
 * 保存import文件记录
 */
function saveImportsCollection() {
	var imports = fileWatcher.getImportsCollection();
	
	//去除空值项
	for (var k in imports) {
		if (imports[k].length === 0) {
			delete imports[k];
		}
	}

	var jsonString = JSON.stringify(imports, null, '\t');

	storage.saveImportsDb(jsonString);
}

/**
 * 合并监听文件import字段
 * @return {[type]} [description]
 */
function mergerWatchedCollection() {
	var watched= fileWatcher.getWatchedCollection(),
		projectsDb = storage.getProjects();

	for (var k in watched) {
		var pid = watched[k].pid,
			fileSrc = watched[k].src;
		projectsDb[pid].files[fileSrc].imports = watched[k].imports;
	}

	storage.updateJsonDb();
}

//save current application status
function saveCurrentAppstatus() {
	var history = {
		activeProject: global.activeProject,
		sidebarWidth: sessionStorage.getItem('sidebarWidth')
	};

	storage.saveHistoryDb(JSON.stringify(history, null, '\t'));
}

exports.init = function () {
	/**
	 * 主界面关闭事件
	 */
	mainWindow.on('close', function () {
		this.hide();

		saveImportsCollection();
		mergerWatchedCollection();
		saveCurrentAppstatus();

		this.close(true);
	});
};