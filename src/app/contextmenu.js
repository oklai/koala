/**
 * main window contextmenu 
 * @type {[type]}
 */

"use strict";

var path           = require('path'),
	fs             = require('fs'),
	projectManager = require('./projectManager.js'),
	il8n           = require('./il8n.js');

var gui = global.gui,
	$   = global.jQuery;

//folder contextmenu
var folderMenu = new gui.Menu(),
	currentContextFolderId;

folderMenu.append(new gui.MenuItem({
	label: il8n.__('Open Folder'),
	click: function () {
		var src = $('#' + currentContextFolderId).data('src');
		gui.Shell.showItemInFolder(src);
	}
}));
folderMenu.append(new gui.MenuItem({
	label: il8n.__('Rename Folder'),
	click: function () {
		var target = $('#' + currentContextFolderId);
		var oldName = target.text(),
			input = $('<input class="changeName"/>').val(oldName).focus();

		target.html(input);
		input.focus();
		target.trigger('click');
	}
}));
folderMenu.append(new gui.MenuItem({type: 'separator'}));
folderMenu.append(new gui.MenuItem({
	label: il8n.__('Delete Folder'),
	click: function () {
		$.koalaui.confirm(il8n.__('are sure delete this folder?'), function () {
			$('#folders').trigger('deleteItem',[currentContextFolderId]);
		});
	}
}));

//bind folders  contextmenu  event 
$('#folders li').live('contextmenu', function (e) {
	currentContextFolderId = $(this).data('id');
	folderMenu.popup(e.pageX, e.pageY);
	return false;
});

//file item contextmenu
var fileMenu = new gui.Menu(),
	currentContextFileId;

fileMenu.append(new gui.MenuItem({
	label: il8n.__('Open Containing Folder'),
	click: function () {
		var src = $('#' + currentContextFileId).data('src');
		gui.Shell.showItemInFolder(src);
	}
}));
fileMenu.append(new gui.MenuItem({
	label: il8n.__('Open Output Folder'),
	click: function () {
		var dir = $('#folders .active').data('src'),
			name = $('#' + currentContextFileId).find('.output span').text();

		var src = path.resolve(dir, name);
		if (fs.existsSync(src)) {
			gui.Shell.showItemInFolder(src);
		} else {
			gui.Shell.showItemInFolder(path.dirname(src));
		}
	}
}));
fileMenu.append(new gui.MenuItem({
	label: il8n.__('Set Output Path'),
	click: function () {
		$('#' + currentContextFileId).find('.changeOutput').trigger('click');
	}
}));
fileMenu.append(new gui.MenuItem({type: 'separator'}));
fileMenu.append(new gui.MenuItem({
	label: il8n.__('Delete File Item'),
	click: function () {
		var fileSrc = $('#' + currentContextFileId).data('src');
		projectManager.removeFileItem(fileSrc, global.activeProject, function () {
			$('#' + currentContextFileId).fadeOut('fast', function () {
				$(this).remove();
			});
		});
	}
}));

//bind folders  contextmenu  event 
$('#filelist li').live('contextmenu', function (e) {
	currentContextFileId = $(this).data('id');
	fileMenu.popup(e.pageX, e.pageY);
	return false;
});