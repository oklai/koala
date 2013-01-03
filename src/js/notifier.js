//通知器，负责向用户输出提示信息

'use strict';

var gui = global.gui,
	$ = global.jQuery,
	mainWindow = global.mainWindow;

var closeTimeId;//自动关闭通知窗口

//less编译错误反馈
exports.showLessError = function(ctx) {
    var message = "";
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

	showNotification(message);
}

//显示系统报错
exports.showSystemError = function(err) {
	global.debug(err);
}

//编译成功日志
exports.createCompileLog = function(file, type) {
	global.debug(file.src + '编译成功！');
}

//显示通知
exports.showNotification = showNotification;

//alert
exports.alert = function(message) {
	message = message || '';
	mainWindow.window.alert(message);
}

//在弹窗上显示通知
function showNotification(message) {
	
	if(global.notifierWindow) {	//弹窗已打开
		activeNotifier(global.notifierWindow);

	}else{	//弹窗未打开
		var popWin = createNotifierWindow('notifier.html');
		popWin.on('loaded', function() {
			activeNotifier(popWin);
		});

		global.notifierWindow = popWin;
	}

	//输出信息
	function activeNotifier(notifier) {
		//取消自动关闭
		if(closeTimeId) {
			clearTimeout(closeTimeId);
		}

		//设定内容
		var document = notifier.window.document;
		document.getElementById('msg').innerHTML = message;
		notifier.show();

		//5秒后自动关闭
		closeTimeId = setTimeout(function() {
			notifier.hide();
		}, 5000);
	}
}
//创建通知窗口
function createNotifierWindow(url, options) {
	var positionX = mainWindow.window.screen.width - 400;
	var defaultOption = {
		width: 400,
		height: 200,
		x: positionX,
		y: 0,
		show: false,
		frame: false,
		toolbar: false
	};
	options = $.extend(defaultOption, options);

	return gui.Window.open(url, options);
}
