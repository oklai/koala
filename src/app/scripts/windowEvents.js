/**
 * window events
 */

'use strict';

var fs          = require('fs'),
    storage     = require('./storage.js'),
    fileWatcher = require('./fileWatcher.js'),
    appConfig   = require('./appConfigManager.js').getAppConfig(),
    appPackage  = require('./appConfigManager.js').getAppPackage(),
    il8n        = require('./il8n.js'),
    mainWindow  = global.mainWindow,
    $           = global.jQuery;

/**
 * save current application status
 */
function saveCurrentAppstatus() {
    var historyDb = storage.getHistoryDb();
    historyDb.activeProject = global.activeProject;
    historyDb.window = {
        x: mainWindow.x,
        y: mainWindow.y
    };
    storage.saveHistoryDb(historyDb);
}

// minimizeToTray
var trayMenu = new nw.Menu(), tray;

// window minimize event
function onMinimize () {
    // always keep tray
    if (process.platform === 'darwin' && tray) {
        return false;
    }

    var trayIcon = process.platform === 'darwin' ? appPackage.window['icon-mac'] : appPackage.window.icon;
    tray = new nw.Tray({icon: trayIcon});
    tray.menu = trayMenu;
    tray.on('click', function () {
        mainWindow.show();

        // always keep tray
        if (process.platform === 'darwin') return false;

        this.remove();
        tray = null;
    });
}
// window restore event
function onRestore () {
    // always keep tray
    if (process.platform === 'darwin') return false;

    if (tray) {
        tray.remove();
        tray = null;
    }
}

// quit app
function quitApp () {
    mainWindow.close();
    saveCurrentAppstatus();
    nw.App.quit();
}

// create menu
trayMenu.append(new nw.MenuItem({
    label: il8n.__('Open'),
    click: function () {
        mainWindow.show();
        onRestore();
    }
}));
trayMenu.append(new nw.MenuItem({
    label: il8n.__('Settings'),
    click: function () {
        mainWindow.show();
        onRestore();
        $('#settings').trigger('click');
    }
}));
trayMenu.append(new nw.MenuItem({type: 'separator'}));
trayMenu.append(new nw.MenuItem({
    label: il8n.__('Exit'),
    click: quitApp
}));

// bind event
mainWindow.on('minimize', function () {
    // minimize to tray has bug on linux
    if (appConfig.minimizeToTray && process.platform !== 'linux') {
        mainWindow.hide();
        onMinimize();
    }
});
mainWindow.on('restore', function () {
    if (appConfig.minimizeToTray && process.platform !== 'linux') {
        onRestore();
    }
});

//main window on close
if (process.platform === 'darwin') {
    // for mac
    onMinimize();
    mainWindow.on('close', function (){
        mainWindow.hide();
        onMinimize();
    });
    nw.App.on('reopen', function () {
        mainWindow.show();
        onRestore();
    });
} else {
    // for windows & linux
    mainWindow.on('close', function () {
        quitApp();
    });
}