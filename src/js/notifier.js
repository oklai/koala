//通知器，负责向用户输出提示信息

"use strict";

var gui = global.gui, $ = global.$;

//less编译错误反馈
exports.showLessError = function(err) {
	var errorMsg =err.type + "Error: " + 
	err.message + " in " + err.filename + ":" + err.line + ":" + err.index + "\n";

	var line = err.line;
	for(var i = 0; i < err.extract.length; i++){
		var curLine = line + i - 1;
		errorMsg += curLine + " " + err.extract[i] + "\n";
	}

	showNotification(errorMsg);
}

//显示系统报错
exports.showSystemError = function(err) {
	console.log(err);
}

//编译成功日志
exports.createCompileLog = function(file, type) {
	console.log(file.src + "编译成功！");
}

//show notifications on new pop window
function showNotification(message) {
	console.log(message);
	//do callback
	global.showNotificationCallback = function(win) {
		global.notificationWindow = win;

		var document = win.window.document;
		global.notificationDocument = document;

		$(document.body).append(message);

		//when pop window closed,reset global notification
		win.on("closed", function() {
			global.notificationWindow = null;
			global.notificationDocument = null;
		});
	}

	//if had pop window,append messege ,else create a new window.
	if(global.notificationWindow && global.notificationDocument) {
		$(global.notificationDocument.body).append(message);

	}else{
		createNotifierWindow("notifier.html");
	}
}

exports.showNotification = showNotification;

function createNotifierWindow(url, options) {
	var defaultOption = {
		position: 'center',
		width: 400,
		height: 200
		// frame: false,
		// toolbar: false
	};
	options = $.extend(defaultOption, options);

	return gui.Window.open(url, options);
}