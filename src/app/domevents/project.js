/**
 * project management
 */

'use strict'; 

//require lib
var fs             = require('fs'),
	storage        = require('../storage.js'),
	projectManager = require('../projectManager.js'),
	jadeManager    = require('../jadeManager.js'),
	$              = global.jQuery,
	document       = global.mainWindow.window.document;

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

//update project folder
$('#refresh').click(function() {
	var id = global.activeProject;

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

//change project name
$(document).on('blur', '#folders .changeName', function () {
	var name = $(this).val(),
		target = $(this).parent(),
		id = target.attr('id');

	storage.getProjects()[id].name = name;
	target.html(name);
});
$(document).on('keyup', '#folders .changeName', function (e) {
	if (e.which === 13) $(this).trigger('blur');
});