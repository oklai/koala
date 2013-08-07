/**
 * window management
 */

'use strict';

var path        = require('path'),
    appPackage  = require('../../appConfigManager.js').getAppPackage(),
    FileManager = global.getFileManager(),
    $           = global.jQuery,
    document    = global.mainWindow.window.document;


var showFrame = function (url) {
    $('#frame')[0].src = url;
    $('#frame').show();
    $('.koalaui-overlay').show();
}

//open settings window
$(document).on('click', '#settings', function (e) {
    showFrame(path.join(FileManager.appViewsDir, 'release/settings.html'));
});

//open log window
$(document).on('click', '#log', function () {
    showFrame(path.join(FileManager.appViewsDir, 'release/log.html'));
});

var hideFrame = global.mainWindow.window.hideFrame = function () {
    $('#frame').hide();
    $('#frame')[0].src = "about:blank";
    $('.koalaui-overlay').hide();
};

$(document).keydown(function (e) {
    // press esc to close frame
    if (e.which === 27) {
        hideFrame();
    }

    // press F12 open devtools
    if (appPackage.window.debug && e.which === 123) {
        global.mainWindow.showDevTools();
    }
});


//window minimize & close
if (process.platform === 'win32') {
    $(document).on('click', '#titlebar .minimize', function () {
        global.mainWindow.minimize();
    });
    $(document).on('click', '#titlebar .close', function () {
        global.mainWindow.close();
    });
}