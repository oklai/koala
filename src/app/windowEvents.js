/**
 * window events
 */

'use strict';

var fs             = require('fs'),
	storage        = require('./storage.js'),
	fileWatcher    = require('./fileWatcher.js'),
	appConfig      = require('./appConfig.js').getAppConfig(),
	appPackage     = require('./appConfig.js').getAppPackage(),
	il8n           = require('./il8n.js'),
	mainWindow     = global.mainWindow,
	gui            = global.gui,
	sessionStorage = mainWindow.window.sessionStorage,
	$              = global.jQuery;

/**
 * save imports collection
 */
function saveImportsCollection() {
	var imports = fileWatcher.getImportsCollection();
	
	//Remove the empty value items
	for (var k in imports) {
		if (imports[k].length === 0) {
			delete imports[k];
		}
	}

	var jsonString = JSON.stringify(imports, null, '\t');

	storage.saveImportsDb(jsonString);
}

/**
 * merger watched collection
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

/**
 * save current application status
 */
function saveCurrentAppstatus() {
	var historyDb = storage.getHistoryDb(),
		history = {
		activeProject: global.activeProject,
		upgradeTipsTime: global.upgradeTipsTime || historyDb.upgradeTipsTime,
		window: {
			x: mainWindow.x,
			y: mainWindow.y
		}
	};

	storage.saveHistoryDb(JSON.stringify(history, null, '\t'));
}

/**
 * minimizeToTray
 */
function minimizeToTray () {
	var trayMenu = new gui.Menu(), tray;

	trayMenu.append(new gui.MenuItem({
		label: il8n.__('tray-open-window'),
		click: function () {
			mainWindow.show();
			tray.remove();
	        tray = null;
		}
	}));
	trayMenu.append(new gui.MenuItem({
		label: il8n.__('tray-settings'),
		click: function () {
			$('#settings').trigger('click');
		}
	}));
	trayMenu.append(new gui.MenuItem({type: 'separator'}));
	trayMenu.append(new gui.MenuItem({
		label: il8n.__('tray-exit'),
		click: function () {
			//TODO
			mainWindow.close();
		}
	}));

	mainWindow.on('minimize', function () {
		this.hide();
		tray = new gui.Tray({icon: appPackage.window.icon});
		tray.menu = trayMenu;
		tray.on('click', function () {
			mainWindow.show();
			this.remove();
	        tray = null;
		});
	});
}


//main window onclose
mainWindow.on('close', function () {
	this.hide();

	saveImportsCollection();
	mergerWatchedCollection();
	saveCurrentAppstatus();

	process.exit();
});

/**
 * minimize to tray when window onminimize
 * has bug on ubuntu
 */
if (appConfig.minimizeToTray && process.platform !== 'linux') minimizeToTray();
