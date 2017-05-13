/**
 * Notifier
 */

'use strict';

var path        = require('path'),
    util        = require('./util.js'),
    FileManager = global.getFileManager(),
    $           = global.jQuery,
    mainWindow  = global.mainWindow;

/**
 * throw error
 * @param  {String} message  error message
 * @param  {String} filePath file path
 */
exports.throwError = function (message, filePath) {
    var fullMessage = message;
    if (filePath) {
        fullMessage = filePath + '\n' +message;
    }

    showNotification(fullMessage, 'error');

    //add log
    addErrorLog({
        file: filePath || "Error",
        message: message
    });
};

/**
 * throw completed
 * @param  {String} message  completed message
 * @param  {String} filePath file path
 */
exports.throwCompleted = function (message, filePath) {
    if (filePath) {
        message = filePath;
    }

    showNotification(message, 'success');
};

/**
 * compile log
 * @type {Array} log
 */
global.errorLogCollection = [];
function addErrorLog (log) {
    log.date = util.dateFormat(new Date(), "hh:mm:ss");
    global.errorLogCollection.push(log);
}

//create a notifier window to show message
exports.showNotification = showNotification;


var notificationWindow;
function showNotification(message, type) {
    //close opend notifier window
    if (notificationWindow) {
        try {
            notificationWindow.close();
        } catch (e) {}
    }

    var options = {};

    if (type === 'success') {
        options.height = 108;
    }

    createNotifierWindow(options, type, function(popWin) {
        popWin.on('loaded', function () {
            popWin.window.document.body.innerHTML = localStorage.getItem('views-notifier');
            popWin.window.init(type, message);
        });

        notificationWindow = popWin;
    });
}

/**
 * create notifier window
 * @param  {Object} options window options
 * @param  {string} status type
 * @return {Object}         new window
 */
function createNotifierWindow(options, type, callback) {
    var defaultOption = {
        width: 400,
        height: 150,
        frame: false,
        resizable: false,
        icon: 'file://' + path.join(FileManager.appAssetsDir, 'img', 'koala.png'),
        show: true,
        focus: false,
        transparent: true,
        show_in_taskbar: process.platform === 'darwin',
        always_on_top: true,
    };

    options = $.extend(defaultOption, options);
    options.x = mainWindow.window.screen.width - options.width - 10,
    options.y = 10;

    //show in the lower right corner on windows system
    if (process.platform === 'win32') {
        options.y = mainWindow.window.screen.availHeight - options.height - 10;
    }
    else if (process.platform === 'darwin') {
        options.y = 25;
    }

    var url = 'file://' + path.join(FileManager.appViewsDir, 'release/notifier.html');

    nw.Window.open(url, options, callback);
}