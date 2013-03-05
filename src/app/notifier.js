//通知器，负责向用户输出提示信息

'use strict';

var gui        = global.gui,
	util     = require('./util.js'),
	appConfig  = require('./appConfig.js').getAppConfig(),
	$          = global.jQuery,
	mainWindow = global.mainWindow;

//less编译错误提示
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

//coffeescript编译错误提示
exports.throwCoffeeScriptError = function(filePath, message) {
	message = filePath + '\n' +message;
	showNotification(message);

	//add log
	addCompileLog({
		file: filePath,
		message: message
	});
};

//sass编译错误提示
exports.throwSassError = function(filePath, message) {
	message = filePath + '\n' +message;
	showNotification(message);

	//add log
	addCompileLog({
		file: filePath,
		message: message
	});
};

//一般性错误提示
exports.throwGeneralError = function(message) {
	showNotification(message);

	//add log
	addCompileLog({
		file: "General Error",
		message: message
	});
}

//程序错误提示
exports.throwAppError = function(message) {
	showNotification(message);

	//add log
	addCompileLog({
		file: "Application Error",
		message: message
	});
};

//编译成功日志
global.compileLog = [];
function addCompileLog (log) {
	log.date = util.dateFormat(new Date(), "hh:mm:ss")
	global.compileLog.push(log);
}
exports.addCompileLog =addCompileLog;

//显示通知
exports.showNotification = showNotification;

//在弹窗上显示通知
var notificationWindow, notificationTimeId;
function showNotification(message) {
	//关闭现有提示窗
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

	//输出信息
	function activeNotifier() {
		//设定内容
		var document = popWin.window.document;

		$('#msg', document).html(message);
		$(document.body).on('mouseenter', function(){

			if(notificationTimeId) clearTimeout(notificationTimeId);

		}).on('mouseleave', function() {

			autoClose();

		});

		autoClose();

		//5秒后自动关闭
		function autoClose() {
			notificationTimeId = setTimeout(function() {
				popWin.close();
			}, 5000);
		}
	}
}
//创建通知窗口
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
		positionY = 0;

	//window系统在右下角显示
	if (process.platform === 'win32') {
		positionY = mainWindow.window.screen.availHeight - options.height;
	}

	options.x = positionX - 10;
	options.y = positionY - 10;

	var url = 'html/' + appConfig.locales + '/notifier.html';
	return gui.Window.open(url, options);
}
