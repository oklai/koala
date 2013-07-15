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
    if (filePath) {
        message = filePath + '\n' +message;
    }

    showNotification(message);

    //add log
    addErrorLog({
        file: filePath || "Error",
        message: message
    });
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
function showNotification(message) {
    //close opend notifier window
    if (notificationWindow) {
        try {
            notificationWindow.close();
        } catch (e) {}
    }

    var popWin = createNotifierWindow();

    // show in active (windows only)
    if (popWin.showInactive) {
        popWin.showInactive();
    }

    popWin.on('loaded', function () {
        // set message
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
            icon: path.join(FileManager.appAssetsDir, 'img', 'koala.png'),
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

    options.x = positionX - 10;
    options.y = positionY;

    return gui.Window.open('views/release/notifier.html', options);
}