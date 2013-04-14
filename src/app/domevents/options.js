/**
 * set compile options
 */

'use strict'; 

//require lib
var path           = require('path'),
	storage        = require('../storage.js'),
	projectsDb     = storage.getProjects(),
	projectManager = require('../projectManager.js'),
	jadeManager    = require('../jadeManager.js'),
	compiler       = require('../compiler.js'),
	il8n           = require('../il8n.js'),
	$              = global.jQuery,
	document       = global.mainWindow.window.document;

/**
 * set output path
 */

/**
 * set single file output path
 * @param {String} fileSrc file src
 * @param {String} pid     project id
 * @param {String} output  output path
 */
function setSingleOutput (selectedItem, pid, output) {
	var outputType = path.extname(output),
		fileSrc    = selectedItem.data('src'),
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

	file.output = output;

	var shortOutput = path.relative(projectsDb[pid].src, output);
	$(selectedItem).find('.output span').text(shortOutput);

	//save project data
	storage.updateJsonDb();
}

/**
 * set multiple output
 * @param {Array} selectedItems selected file items
 * @param {String} pid          project id
 * @param {String} outputDir    selected output dir path
 */
function setMultipleOutput (selectedItems, pid, outputDir) {
	var activeProject = projectsDb[pid];

	selectedItems.each(function () {
		var src        = $(this).data('src'),
			targetFile = projectsDb[pid].files[src],
			oldOutput  = targetFile.output,
			newOutput  = outputDir + path.sep + path.basename(oldOutput);

		targetFile.output = newOutput;

		var shortOutput = path.relative(activeProject.src, newOutput);
		$(this).find('.output span').text(shortOutput);
	})

	//save project data
	storage.updateJsonDb();
}

//bind file input change event
$('#ipt_fileOutput').change(function() {
	var output = $(this).val(),
		selectedItem = $('#filelist').data('selectedItems');
		
	setSingleOutput(selectedItem, global.activeProject, output);

	//reset
	$('#filelist').data('selectedItems', null);
	this.value = '';
});

$('#ipt_fileOutputDir').change(function () {
	var output = $(this).val(),
		selectedItems = $('#filelist').data('selectedItems');

	setMultipleOutput(selectedItems, global.activeProject, output);

	//reset
	$('#filelist').data('selectedItems', null);
	this.value = '';
});

//bind setOutputPath event
$('#filelist').on('setOutputPath', '.file_item', function () {
	var selectedItems = $('#filelist li.ui-selected');
	if (!selectedItems.length) return false;

	$('#filelist').data('selectedItems', selectedItems);

	if (selectedItems.length === 1) {
		$('#ipt_fileOutput')
			.attr('nwWorkingDir', path.dirname(selectedItems.data('src')))
			.trigger('click');

	} else {

		$('#ipt_fileOutputDir')
			.attr('nwWorkingDir', $('#folders .active').data('src'))
			.trigger('click');
	}
});
$('#filelist').on('click', '.changeOutput', function() {
	var selectItem  = $(this).closest('.file_item');

	$('#ipt_fileOutput')
		.attr('nwWorkingDir', path.dirname(selectItem.data('src')))
		.trigger('click');

	$('#filelist').data('selectedItems', selectItem);
});


//switch dynamic compilation
$(document).on('change', '#compileSettings .compileStatus', function(){
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
['lineComments', 'compass', 'unixNewlines', 'bare', 'lint', 'debugInfo'].forEach(function (optionName) {
	$(document).on('change', '#compileSettings .' + optionName, function () {
		var changeValue = {settings: {}},
			fileSrc = $('#compileSettings').find('[name=src]').val(),
			pid = $('#compileSettings').find('[name=pid]').val();

		changeValue.settings[optionName] = this.checked;

		projectManager.updateFile(pid, fileSrc, changeValue);
	});
});

//change output style
$(document).on('change', '#compileSettings .outputStyle', function () {
	var style = this.value,
		changeValue = {settings: {
			outputStyle: style
		}},
		fileSrc = $('#compileSettings').find('[name=src]').val(),
		pid = $('#compileSettings').find('[name=pid]').val();

	projectManager.updateFile(pid, fileSrc, changeValue);
});

//run compile manually
$(document).on('click', '#compileSettings .compileManually', function () {
	var src = $('#compileSettings').find('[name=src]').val(),
		pid = $('#compileSettings').find('[name=pid]').val();

	var loading = $.koalaui.loading(il8n.__('compileing...'));
	setTimeout(function () {
		compiler.runCompile(projectsDb[pid].files[src], function () {
			loading.hide();
			$.koalaui.tooltip('Success');
		}, function () {
			loading.hide();
			$.koalaui.tooltip('Error');
		});
	}, 0);
});

//show compile settings panel
$('#filelist').on('setCompileOptions', '.file_item', function () {
	var pid        = $(this).data('pid'),
		src        = $(this).data('src'),
		file       = projectsDb[pid].files[src];

	var settingsHtml = jadeManager.renderSettings(file);

	$('#extend > .inner').html(settingsHtml);
	$('#extend').addClass('show');
});

//close compile settings panel
$('#window').click(function (e) {
	if ($(e.target).closest('#filelist').length === 0 && $(e.target).closest('#extend').length === 0) {
		$('#filelist li.ui-selected').removeClass('ui-selected');
		$('#extend').removeClass('show');
	}
});

//remove file item
$('#filelist').on('removeFileItem', '.file_item', function () {
	var selectedItems = $('#filelist li.ui-selected'),
		fileSrcList = [];

	selectedItems.each(function () {
		fileSrcList.push($(this).data('src'));
	});

	projectManager.removeFileItem(fileSrcList, global.activeProject, function () {
		selectedItems.fadeOut('fast', function () {
			selectedItems.remove();
		});
	});
});