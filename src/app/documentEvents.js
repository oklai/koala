/**
 * the main window document events
 */

'use strict'; 

//require lib
var path           = require('path'),
	fs             = require('fs'),
	storage        = require('./storage.js'),
	projectManager = require('./projectManager.js'),
	jadeManager    = require('./jadeManager.js'),
	compiler       = require('./compiler.js'),
	appConfig      = require('./appConfig.js').getAppConfig(),
	$              = global.jQuery;

/**
 * add project
 * @param {String} dir directory path
 */
function addProject (dir) {
	var loading = $.koalaui.loading();
	
	setTimeout(function () {
		//check project exists 
		var projectExists = projectManager.checkProjectExists(dir);
		if(projectExists.exists) {
			$('#' + projectExists.id).trigger('click');
			loading.hide();
			return false;
		}

		projectManager.addProject(dir, function(item) {
			var folderHtml = jadeManager.renderFolders([item]);
			$('#folders').append(folderHtml);

			loading.hide();
			$('#folders li:last').trigger('click');
		});

	}, 1);	
}

$('#addDirectory').bind('click', function(){
	$('#ipt_addProject').trigger('click');
});
$('#ipt_addProject').bind('change', function(){
	addProject($(this).val());
	$(this).val('')
});

//drag folder to window
global.mainWindow.window.ondrop = function (e) {
	e.preventDefault();
	return false;
};
global.mainWindow.window.ondragover = function (e) {
	e.preventDefault();
	return false;
};

(function bindDragEvents () {
	var dropOverlay = $('#dragover-overlay'),
    dropTarget = $('html'),
    showDrag = false,
    timeout = -1;

	dropTarget.bind('dragenter', function () {
	    dropOverlay.addClass('show');
	    showDrag = true; 
	});
	dropTarget.bind('dragover', function(){
	    showDrag = true; 
	});
	dropTarget.bind('dragleave', function (e) {
	    showDrag = false; 
	    clearTimeout( timeout );
	    timeout = setTimeout( function(){
	        if( !showDrag ){ dropOverlay.removeClass('show'); }
	    }, 200 );
	});

	dropTarget[0].ondrop = function (e) {
		showDrag = false;
		dropOverlay.removeClass('show');

		var dirs = [], files = e.dataTransfer.files;
		for (var i = 0; i < files.length; ++i) {
			if (fs.statSync(files[i].path).isDirectory()) {
				dirs.push(files[i].path)
			}
		}
		dirs.forEach(function (item) {
			addProject(item);
		});

	}

	dropTarget.bind('dragend', function(){
	    global.debug('dragend')
	});

})();


//browse project files
$('#folders li').live('click', function(){
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

//delete project
$('#folders').bind('deleteItem', function(event, deleteId){
	var activeProjectElem = $('#' + deleteId);

	if (!activeProjectElem[0]) {
		return false;
	}

	var id = activeProjectElem.data('id');

	projectManager.deleteProject(id, function(){
		//show next project
		var nextItem;
		if(activeProjectElem.next().length > 0){
			nextItem = activeProjectElem.next()
		}
		if(activeProjectElem.prev().length > 0){
			nextItem = activeProjectElem.prev()
		}

		if(nextItem){
			nextItem.trigger('click');
		}else{
			$('#files ul').html('');
		}

		//delete dom
		activeProjectElem.remove();
	});
});

//change compile output
$('#ipt_fileOutput').change(function() {
	var projectsDb = storage.getProjects(),
		output = $(this).val(),
		outputType = path.extname(output),
		pid = $('#folders').find('.active').data('id'),
		fileSrc = $('#ipt_fileData').val(),
		file = projectsDb[pid].files[fileSrc];

	if (output.length === 0 || file.output === output) {
		return false;
	}

	var suffixs = {
		'less': '.css',
		'sass': '.css',
		'scss': '.css',
		'coffee': '.js'
	};
	if (outputType !== suffixs[file.type]) {
		$.koalaui.alert('please select a ' + suffixs[file.type] + ' file');
		return false;
	}

	projectManager.updateFile(pid, fileSrc, {output: output}, function() {
		var shortOutput = path.relative(projectsDb[pid].src, output);
		$('#' + file.id).find('.output span').text(shortOutput);
	});
});
$('.changeOutput').live('click', function() {
	var src = $(this).closest('li').data('src');
	$('#ipt_fileData').val(src);
	$('#ipt_fileOutput').trigger('click');
});

//update project folder
$('#refresh').click(function() {
	var id = $('#folders .active').data('id');

	if (!id) return false;

	var loading = $.koalaui.loading();
	projectManager.refreshProject(id, function(invalidFileIds, newFiles) {
		if (invalidFileIds.length > 0) {
			invalidFileIds.forEach(function (item) {
				$('#' + item).remove();
			});
		}
		
		if (newFiles.length > 0) {
			var htmlElements = $(jadeManager.renderFiles(newFiles));
			htmlElements.addClass('new').prependTo('#files ul');
			//animation
			setTimeout(function () {
				htmlElements.removeClass('new');
			}, 100);
		}

		loading.hide();
	});
});

//switch dynamic compilation
$('#compileSettings .compileStatus').live('change', function(){
	var fileId = $('#compileSettings').find('[name=id]').val(),
		fileSrc = $('#compileSettings').find('[name=src]').val(),
		pid = $('#compileSettings').find('[name=pid]').val(),
		fileItem = $('#' + fileId),
		compileStatus = this.checked;
		
	projectManager.updateFile(pid, fileSrc, {compile: compileStatus}, function() {
		if (!compileStatus) {
			fileItem.addClass('disable');
		} else {
			fileItem.removeClass('disable');
		}
	});
});

//set compile options
['lineComments', 'compass', 'unixNewlines', 'bare', 'lint'].forEach(function (optionName) {
	$('#compileSettings .' + optionName).live('change', function () {
		var changeValue = {settings: {}},
			fileSrc = $('#compileSettings').find('[name=src]').val(),
			pid = $('#compileSettings').find('[name=pid]').val();

		changeValue.settings[optionName] = this.checked;

		projectManager.updateFile(pid, fileSrc, changeValue);
	});
});

//change output style
$('#compileSettings .outputStyle').live('change', function () {
	var style = this.value,
		changeValue = {settings: {
			outputStyle: style
		}},
		fileSrc = $('#compileSettings').find('[name=src]').val(),
		pid = $('#compileSettings').find('[name=pid]').val();

	projectManager.updateFile(pid, fileSrc, changeValue);
});

//run compile manually
$('#compileSettings .compileManually').live('click', function () {
	var src = $('#compileSettings').find('[name=src]').val(),
		pid = $('#compileSettings').find('[name=pid]').val(),
		projectsDb = storage.getProjects();

	compiler.runCompile(projectsDb[pid].files[src], function () {
		$.koalaui.tooltip('Success');
	});
});

//show compile settings
$('.file_item').live('click', function () {
	if ($(this).hasClass('selected')) {
		return false;
	}

	var pid        = $(this).data('pid'),
		src        = $(this).data('src'),
		projectsDb = storage.getProjects(),
		file       = projectsDb[pid].files[src];

	var settingsHtml = jadeManager.renderSettings(file);

	$('.file_item.selected').removeClass('selected');
	$(this).addClass('selected');

	$('#extend > .inner').html(settingsHtml);
	$('#extend').addClass('show');
});

//close compile settings  
$('#window').click(function (e) {
	if ($(e.target).closest('#filelist').length === 0 && $(e.target).closest('#extend').length === 0) {
		$('#filelist .selected').removeClass('selected');
		$('#extend').removeClass('show');
	}
});

//file type navigation
$('#typeNav li').click(function () {
	if ($(this).hasClass('current')) return false;

	var target = $(this).data('type');

	if (target === 'all') {
		$('#filelist li').show();
	} else {
		$('#filelist li').hide();
		if (/sass|scss/.test(target)) {
			$('#filelist').find('.type_sass, .type_scss').show();
		} else {
			$('#filelist .type_' + target).show();
		}

	}

	$('#typeNav .current').removeClass('current');
	$(this) .addClass('current');
}); 

//change project name
$('#folders .changeName').live('blur', function () {
	var name = $(this).val(),
		target = $(this).parent(),
		id = target.attr('id');

	storage.getProjects()[id].name = name;
	target.html(name);
});
$('#folders .changeName').live('keyup', function (e) {
	if (e.which === 13) $(this).trigger('blur');
});

//open settings window
$('#settings').live('click', function () {
	if (global.settingsOpened) return false;
	
	var options = {
		width: 400,
		height: 500,
		toolbar: false
	};
	var url = 'html/' + appConfig.locales + '/settings.html';
	global.gui.Window.open(url, options);
	global.settingsOpened = true;
});

//window minimize & close 
$('#titlebar .minimize').live('click', function () {
	global.mainWindow.minimize();
});
$('#titlebar .close').live('click', function () {
	global.mainWindow.close();
});