/**
 * Notifier
 */

'use strict';

var path        = require('path'),
    util        = require('./util.js'),
    FileManager = global.getFileManager(),
    gui         = global.gui,
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

    showNotification(fullMessage);

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

    var popWin = createNotifierWindow(options);

    // show in active (windows only)
    if (popWin.showInactive) {
        popWin.showInactive();
    }

    popWin.on('loaded', function () {
        // set message
        if (type === 'success') {
            $(popWin.window.document.body).addClass('success').find('.dragbar').text('Success');
        }
        $('#msg', popWin.window.document).html(message);

        if (!popWin.showInactive) {
            popWin.show();
        }
    });

    notificationWindow = popWin;
}

/**
 * create notifier window
 * @param  {Object} options window options
 * @return {Object}         new window
 */
function createNotifierWindow(options) {
    var defaultOption = {
            width: 400,
            height: 150,
            frame: false,
            toolbar: false,
            resizable: false,
            icon: path.join(FileManager.appAssetsDir, 'img/koala.png'),
            show: false,
            show_in_taskbar: false
        };

    options = $.extend(defaultOption, options);

    var positionX = mainWindow.window.screen.width - options.width,
        positionY = 10;

    //show in the lower right corner on windows system
    if (process.platform === 'win32') {
        positionY = mainWindow.window.screen.availHeight - options.height - 10;
    } 
    else if (process.platform === 'darwin') {
        positionY = 25;
    }

    options.x = positionX - 10;
    options.y = positionY;

    return gui.Window.open('file://' + path.join(FileManager.appViewsDir, 'release/notifier.html'), options);
}