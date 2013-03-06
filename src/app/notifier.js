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
	addCompileLog({
		file: filePath,
		message: message
	});
}

/**
 * throw compile error of coffeescript
 * @param  {string} filePath file path
 * @param  {string} message  error message
 */
exports.throwCoffeeScriptError = function(filePath, message) {
	message = filePath + '\n' +message;
	showNotification(message);

	//add log
	addCompileLog({
		file: filePath,
		message: message
	});
};

/**
 * throw compile error of sass
 * @param  {string} filePath file path
 * @param  {string} message  error message
 */
exports.throwSassError = function(filePath, message) {
	message = filePath + '\n' +message;
	showNotification(message);

	//add log
	addCompileLog({
		file: filePath,
		message: message
	});
};

/**
 * throw general error
 * @param  {string} message  error message
 */
exports.throwGeneralError = function(message) {
	showNotification(message);

	//add log
	addCompileLog({
		file: "General Error",
		message: message
	});
}

/**
 * throw app error
 * @param  {string} message  error message
 */
exports.throwAppError = function(message) {
	showNotification(message);

	//add log
	addCompileLog({
		file: "Application Error",
		message: message
	});
};

/**
 * compile log
 * @type {Array} log
 */
global.compileLog = [];
function addCompileLog (log) {
	log.date = util.dateFormat(new Date(), "hh:mm:ss")
	global.compileLog.push(log);
}
exports.addCompileLog =addCompileLog;

//create a notifier window to show message
exports.showNotification = showNotification;


var notificationWindow, notificationTimeId;
function showNotification(message) {
	//close opend notifier window
	if (notificationWindow) {
		notificationWindow.close();
		clearTimeout(notificationTimeId);
	}

	var popWin = createNotifierWindow();
		notificationWindow = popWin;

	popWin.on('loaded', function() {
		activeNotifier();
		popWin.show();
	});

	//set message
	function activeNotifier() {
		var document = popWin.window.document;

		$('#msg', document).html(message);
		$(document.body).on('mouseenter', function(){

			if(notificationTimeId) clearTimeout(notificationTimeId);

		}).on('mouseleave', function() {

			autoClose();

		});

		autoClose();

		//auto close
		function autoClose() {
			notificationTimeId = setTimeout(function() {
				popWin.close();
			}, 5000);
		}
	}
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
			'always-on-top': true,
			icon: "img/koala.png"
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
