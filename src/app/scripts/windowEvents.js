/**
 * window events
 */

'use strict';

var fs          = require('fs'),
    storage     = require('./storage.js'),
    fileWatcher = require('./fileWatcher.js'),
    appConfig   = require('./appConfig.js').getAppConfig(),
    appPackage  = require('./appConfig.js').getAppPackage(),
    il8n        = require('./il8n.js'),
    mainWindow  = global.mainWindow,
    gui         = global.gui,
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
    storage.saveHistoryDb(JSON.stringify(historyDb, null, '\t'));
}

/**
 * minimizeToTray
 */
function minimizeToTray () {
    var trayMenu = new gui.Menu(), tray;

    trayMenu.append(new gui.MenuItem({
        label: il8n.__('Open'),
        click: function () {
            mainWindow.show();
            tray.remove();
            tray = null;
        }
    }));
    trayMenu.append(new gui.MenuItem({
        label: il8n.__('Settings'),
        click: function () {
            mainWindow.show();
            $('#settings').trigger('click');
        }
    }));
    trayMenu.append(new gui.MenuItem({type: 'separator'}));
    trayMenu.append(new gui.MenuItem({
        label: il8n.__('Exit'),
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

    saveCurrentAppstatus();

    gui.App.quit();
});

/**
 * minimize to tray when window onminimize
 * has bug on ubuntu
 */
if (appConfig.minimizeToTray && process.platform !== 'linux') minimizeToTray();