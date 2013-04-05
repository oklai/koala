/**
 * Application initialization
 */

'use strict';

var fs             = require('fs'),
	appConfig      = require('./appConfig.js'),
	storage        = require('./storage.js'),
	jadeManager    = require('./jadeManager.js'),
	fileWatcher    = require('./fileWatcher.js'),
	projectManager = require('./projectManager.js'),
	notifier       = require('./notifier.js'),
	il8n           = require('./il8n.js'),
	util           = require('./util.js');

var	historyDb      = storage.getHistoryDb(),
	$              = global.jQuery,
	mainWindow     = global.mainWindow;


/**
 * render main window view
 */
function renderMainWindow () {
	var lang = appConfig.getAppConfig().locales,
		targetMainPage = process.cwd() + '/html/' + lang + '/main.html';

	var html = fs.readFileSync(targetMainPage, 'utf8');

	$('#window').append(html);
}

/**
 * render projects view
 */
function renderProjects() {
	projectManager.checkStatus(); //filter invalid forder

	var projectsDb = storage.getProjects(),
		projectsList = [],
		lastActiveProjectId = historyDb.activeProject,
		activeProjectFiles = [];

	//read projects list
	for(var k in projectsDb){
		projectsList.push(projectsDb[k]);
	}

	//load prev active project files
	if (lastActiveProjectId && projectsDb[lastActiveProjectId]) {
		var activeProject = projectsDb[lastActiveProjectId];
		//read active project files
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
}

/**
 * resume main window position and size
 * @return {[type]} [description]
 */
function resumeWindow () {
	if (util.isEmptyObject(historyDb)) return false;

	var x = historyDb.window.x, 
		y = historyDb.window.y, 
		availWidth = mainWindow.window.screen.availWidth,
		availHeight = mainWindow.window.screen.availHeight;

	if (historyDb.window.x >= availWidth || historyDb.window.x <= (-availWidth - mainWindow.width) || historyDb.window.y >= availHeight || historyDb.window.y < 0) {
		x = null;
		y = null;
	}

	if (historyDb.window) {
		if (x) mainWindow.x = x;
		if (y) mainWindow.y = y;
	}
}

/**
 * star watch projects
 */
function startWatchProjects() {
	//get projects data
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
		//add watch listener
		fileWatcher.add(compileFiles);
	}
}

/**
 * add watch listener to imports
 */
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


/**
 * check upgrade
 */
function checkUpgrade () {
	//not check if has checked in last 7 days.
	var intervalDays = (new Date(historyDb.upgradeTipsTime) - new Date()) / (24 * 60 * 60 * 1000);
	if (-parseInt(intervalDays) <= 7) {
		return false;
	}

	var appPackage = appConfig.getAppPackage(),
		url = appPackage.maintainers.upgrade,
		currentVersion = appPackage.version;

	util.checkUpgrade(url, currentVersion, function (data) {
		global.upgradeTipsTime = (new Date()).toString();

		var message = il8n.__('New Version Found', data.version);
		$.koalaui.confirm(message, function () {
			global.gui.Shell.openExternal(data.news);
		});
	});
}

exports.init = function() {
	//rander main window view
	renderMainWindow();
	renderProjects();

	//bind dom events
	require('./documentEvents.js');

	//bind contextmenu events
	require('./contextmenu.js');

	resumeWindow();
	mainWindow.show();

	//start watch files
	startWatchProjects();
	startWatchImports();

	//bind main window events
	require('./windowEvents.js');

	//check upgrade
	checkUpgrade();
}