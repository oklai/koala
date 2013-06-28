/**
 * Notifier
 */

'use strict';

var gui        = global.gui,
	util     = require('./util.js'),
	appConfig  = require('./appConfig.js').getAppConfig(),
	$          = global.jQuery,
	mainWindow = global.mainWindow;

/**
 * throw compile error of less
 * @param  {string} filePath file path
 * @param  {Object} ctx      error object
 */
exports.throwLessError = function(filePath, ctx) {
	var message = "";

	if (ctx.extract) {
	    var extract = ctx.extract;
	    var error = [];

	    if (typeof(extract[0]) === 'string') {
	        error.push((ctx.line - 1) + ' ' + extract[0]);
	    }
	    if (extract[1]) {
	        error.push(ctx.line + ' ' + extract[1]);
	    }
	    if (typeof(extract[2]) === 'string') {
	        error.push((ctx.line + 1) + ' ' + extract[2]);
	    }

	    message += ctx.type + 'Error: ' + ctx.message;

		if (ctx.filename) {
			message += ' in ' + ctx.filename + ':' + ctx.line + ':' + ctx.column + '\n';
		}

		message += error.join('\n');

	} else {
		message = filePath + '\n' + ctx.message;
	}

	showNotification(message);

	//add log
	addErrorLog({
		file: filePath,
		message: message
	});
}

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
}

/**
 * compile log
 * @type {Array} log
 */
global.errorLogCollection = [];
function addErrorLog (log) {
	log.date = util.dateFormat(new Date(), "hh:mm:ss")
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
	popWin.showInactive();
	popWin.on('loaded', function() {
		// set message
		$('#msg', popWin.window.document).html(message);
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

	var url = 'html/' + appConfig.locales + '/notifier.html';
	return gui.Window.open(url, options);
}