/**
 * window management
 */

'use strict'; 

var appConfig      = require('../appConfig.js').getAppConfig(),
	$              = global.jQuery,
	document       = global.mainWindow.window.document;


var showFrame = function (url) {
	$('#frame')[0].src = url;
	$('#frame').show();
	$(document.body).append('<div class="koalaui-overlay"></div>');
}

//open settings window
$(document).on('click', '#settings', function (e) {
	showFrame('html/' + appConfig.locales + '/settings.html');
});

//open log window
$(document).on('click', '#log', function () {
	showFrame('html/' + appConfig.locales + '/log.html');
});

var hideFrame = global.mainWindow.window.hideFrame = function () {
	$('#frame').hide();
	$('#frame')[0].src = "about:blank";
	$('.koalaui-overlay').hide();
};

//press esc to close
$(document).keydown(function (e) {
	if (e.which === 27) {
		hideFrame();
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