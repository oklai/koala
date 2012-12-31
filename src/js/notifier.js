//通知器，负责向用户输出提示信息

'use strict';

var gui = global.gui, $ = global.jQuery;

//less编译错误反馈
exports.showLessError = function(err) {
	var errorMsg =err.type + 'Error: ' + 
	err.message + ' in ' + err.filename + ':' + err.line + ':' + err.index + '\n';

	var line = err.line;
	for(var i = 0; i < err.extract.length; i++){
		var curLine = line + i - 1;
		errorMsg += curLine + ' ' + err.extract[i] + '\n';
	}

	showNotification(errorMsg);
}

//显示系统报错
exports.showSystemError = function(err) {
	console.log(err);
}

//编译成功日志
exports.createCompileLog = function(file, type) {
	console.log(file.src + '编译成功！');
}

//在弹窗上显示通知
function showNotification(message) {
	
	if(global.notifierWindow) {	//弹窗已打开

		showMsgIn(global.notifierWindow);

	}else{	//弹窗未打开
		var popWin = createNotifierWindow('notifier.html');
		popWin.on('loaded', function() {
			showMsgIn(popWin);
		});

		//关闭弹窗后重置notifierWindow的值
		popWin.on('closed', function() {
			global.notifierWindow = null;
		});

		global.notifierWindow = popWin;
	}

	//输出信息
	var timeId;
	function showMsgIn(popWin) {
		//取消自动关闭
		if(timeId) {
			clearTimeout(timeId);
		}

		//设定内容
		var document = popWin.window.document;
		document.getElementById('msg').innerHTML = message;
		popWin.show();

		//5秒后自动关闭
		timeId = setTimeout(function() {

			popWin.close();

		}, 5000);
	}
}

exports.showNotification = showNotification;

function createNotifierWindow(url, options) {
	var positionX = global.mainWindow.window.screen.width - 400;
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