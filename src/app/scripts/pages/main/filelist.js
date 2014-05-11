/**
 * file list management
 */

'use strict';

//require lib
var path        = require('path'),
    storage     = require('../../storage.js'),
    jadeManager = require('../../jadeManager.js'),
    compilersManager  = require('../../compilersManager.js'),
    fileTypesManager  = require('../../fileTypesManager.js'),
    $           = global.jQuery,
    document    = global.mainWindow.window.document;

//browse project files
$(document).on('click', '#folders li', function () {
    if ($(this).hasClass('active')) return false;

    var loading = $.koalaui.loading();

    var self = $(this),
        id = self.data('id');

    var projectsDb = storage.getProjects(),
        files = projectsDb[id].files,
        fileList = [],
        html = '';

    for (var k in files) {
        fileList.push(files[k])
    }

    if (fileList.length > 0) {
        html = jadeManager.renderFiles(fileList);
    }

    $('#files ul').html(html);
    $('#folders .active').removeClass('active');

    $('#typeNav .current').removeClass('current');
    $('#typeNav li:first').addClass('current');

    self.addClass('active');
    global.activeProject = id;

    loading.hide();
});

// reload project files
$(document).on('reload', '#folders li', function () {
    $('#filelist').html('');
    $(this).removeClass('active').trigger('click');
});

//file type navigation
$('#typeNav li').click(function () {
    if ($(this).hasClass('current')) return false;

    var type = $(this).data('type');

    if (type === 'all') {
        $('#filelist li').show();
    } else {
        $('#filelist li').hide();
        $('#filelist .type_' + type).show();
    }

    $('#typeNav .current').removeClass('current');
    $(this).addClass('current');
});

//create selector
var selectItemPrev = -1;
$('#filelist').selectable({
    filter: 'li:visible',
    stop: function (event, ui) {
        var selectedItems = $('#filelist li.ui-selected')
        if (selectedItems.length === 1) {
            selectedItems.trigger('setCompileOptions');
        } else {
            $('#extend').removeClass('show');
        }
    },
    selecting: function(e, ui) { // on select
        var curr = $(ui.selecting.tagName, e.target).index(ui.selecting); // get selecting item index
        if(e.shiftKey && selectItemPrev > -1) { // if shift key was pressed and there is previous - select them all
            $(ui.selecting.tagName, e.target).slice(Math.min(selectItemPrev, curr), 1 + Math.max(selectItemPrev, curr)).addClass('ui-selected');
            selectItemPrev = -1; // and reset prev
        } else {
            selectItemPrev = curr; // othervise just save prev
        }
    }
});

//ctrl+a || command+a to select all
$(document).on(process.platform === 'darwin' ? 'keydown.meta_a' : 'keydown.ctrl_a', function () {
    $('#filelist li').addClass('ui-selected');
    $('#extend').removeClass('show');
});

// backspace || del to remove files and folders
$(document).on(process.platform === 'darwin' ? 'keydown.backspace' : 'keydown.del', function () {
    if ($('#filelist li.ui-selected').length > 0) {
        $('#filelist li.ui-selected').filter(':first').trigger('removeFileItem');
    } else {
        $('#folders').trigger('deleteItem', [$('#folders li.active').data('id')]);
    }
});