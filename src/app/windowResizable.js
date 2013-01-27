/**
 * window resizable
 */

'use strict'; 

var appPackage = require('./appConfig.js').getAppPackage(),
	$          = global.jQuery,
	mainWindow = global.mainWindow,
	resizable  = $('#window_resizable'),
	minWidth   = appPackage.min_width,
	minHeight  = appPackage.min_height;

//north resize
$('#window_resizable .resizable_n').drag({
	move: function (x,y) {
		var height = mainWindow.height - y;

		if (height < minHeight) {
			$('#window_resizable .resizable_n').trigger('mouseup');
			return false;
		}

		mainWindow.height = height;
	}
});

//south resize
$('#window_resizable .resizable_s').drag({
	move: function (x,y) {
		var height = mainWindow.height + y;

		if (height < minHeight) {
			$('#window_resizable .resizable_s').trigger('mouseup');
			return false;
		}

		mainWindow.height = height;
	}
});

//west resize
$('#window_resizable .resizable_w').drag({
	move: function (x) {
		var width = mainWindow.width - x;

		if (width < minWidth) {
			$('#window_resizable .resizable_w').trigger('mouseup');
			return false;
		}

		mainWindow.width = width;
	}
});

//east resize
$('#window_resizable .resizable_e').drag({
	move: function (x) {
		var width = mainWindow.width + x;

		if (width < minWidth) {
			$('#window_resizable .resizable_e').trigger('mouseup');
			return false;
		}

		mainWindow.width = width;
	}
});

//south east resize
$('#window_resizable .resizable_se').drag({
	move: function (x, y) {
		var width = mainWindow.width + x,
			height = mainWindow.height + y;

		if (width < minWidth && height < minHeight) {
			$('#window_resizable .resizable_se').trigger('mouseup');
			return false;
		}

		if (width >= minWidth) {
			mainWindow.width = width;
		}

		if (height >= minHeight) {
			mainWindow.height = height;
		}
	}
});

//window move
$('#framebar').drag({
	move: function (x, y) {
		var moveX   = mainWindow.x + x,
			moveY  = mainWindow.y + y;

		if (moveX >= 0) {
			mainWindow.x = moveX;
		}

		if (moveY >= 0) {
			mainWindow.y = moveY;
		}
	}
});
