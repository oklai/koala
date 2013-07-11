/**
 * file list management
 */

'use strict'; 

//require lib
var storage        = require('../../storage.js'),
	jadeManager    = require('../../jadeManager.js'),
	$              = global.jQuery,
	document       = global.mainWindow.window.document;

//browse project files
$(document).on('click', '#folders li', function(){
	if ($(this).hasClass('active')) return false;
	
	var loading = $.koalaui.loading(); 

	var self = $(this),
		id = self.data('id');

	var projectsDb = storage.getProjects(),
		files = projectsDb[id].files,
		fileList = [],
		html = '';

	for(var k in files) {
		fileList.push(files[k])
	}

	if(fileList.length > 0) {
		html = jadeManager.renderFiles(fileList);
	}

	$('#files ul').html(html);
	$('#folders .active').removeClass('active');

	self.addClass('active');
	global.activeProject = id;

	loading.hide();
});

// reload project files
$(document).on('reload', '#folders li', function(){
	$('#filelist').html('');
	$(this).removeClass('active').trigger('click');
});

//file type navigation
$('#typeNav li').click(function () {
	if ($(this).hasClass('current')) return false;

	var target = $(this).data('type');

	if (target === 'all') {
		$('#filelist li').show();
	} else {
		$('#filelist li').hide();
		$('#filelist .type_' + target).show();
	}

	$('#typeNav .current').removeClass('current');
	$(this) .addClass('current');
}); 

//create selector
$('#filelist').selectable({
	stop: function(event, ui) {
		var selectedItems = $('#filelist li.ui-selected')
		if (selectedItems.length === 1) {
			selectedItems.trigger('setCompileOptions');
		} else {
			$('#extend').removeClass('show');
		}
	}
});

//ctrl+a || command+a to select all 
$(document).on(process.platform === 'darwin' ? 'keydown.meta_a' : 'keydown.ctrl_a', function() {
	$('#filelist li').addClass('ui-selected');
	$('#extend').removeClass('show');
});