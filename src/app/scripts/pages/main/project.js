/**
 * project management
 */

'use strict';

//require lib
var fs                = require('fs'),
    path              = require('path'),
    storage           = require('../../storage.js'),
    projectManager    = require('../../projectManager.js'),
    jadeManager       = require('../../jadeManager.js'),
    il8n              = require('../../il8n.js'),
    $                 = global.jQuery,
    document          = global.mainWindow.window.document;

/**
 * add project
 * @param {String} dir directory path
 */
function addProject (dir) {
    var loading = $.koalaui.loading();
    //check project exists
    var projectExists = projectManager.checkProjectExists(dir);
    if (projectExists.exists) {
        $.koalaui.confirm(il8n.__('This folder has been added, whether you want to add it as a new project?'), function () {
            add();
        }, function () {
            $('#' + projectExists.id).trigger('click');
            loading.hide();
            return false;
        });

    } else {
        add();
    }

    function add () {
        setTimeout(function () {
            projectManager.addProject(dir, function (item) {
                var folderHtml = jadeManager.renderFolders([item]);
                $('#folders').append(folderHtml);

                loading.hide();
                $('#addprojecttips').hide();
                $('#folders li:last').trigger('click');
            });
        }, 1);
    }
}

/**
 * add file item into the current project
 * @param {Array} filelist file array
 * @param {Number} pid  current project id
 */
function addFileItem (filelist, pid) {
    var loading = $.koalaui.loading();
    setTimeout(function () {
        projectManager.addFileItem(filelist, pid, function (newFiles) {
            if (newFiles.length > 0) appendNewFilesHtml(newFiles);
            loading.hide();
        });
    }, 1);
}

/**
 * append new file item html
 * @param  {Array} newFiles new files
 */
function appendNewFilesHtml (newFiles) {
    var htmlElements = $(jadeManager.renderFiles(newFiles));
        htmlElements.addClass('new').prependTo('#files ul');
        //animation
        setTimeout(function () {
            htmlElements.removeClass('new');
        }, 100);
}

$('#addDirectory').bind('click', function () {
    $('#ipt_addProject').trigger('click');
});
$('#ipt_addProject').bind('change', function () {
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
    $('html')[0].ondrop = function (e) {
        var items = e.dataTransfer.files;

        // install language pack
        if (items.length === 1 && path.extname(items[0].name) === '.koala-locales') {
            require('../../localesManager.js').install(items[0].path);
            return false;
        }

        // install extension pack
        if (items.length === 1 && path.extname(items[0].name) === '.koala-compiler') {
            require('../../compilersManager.js').install(items[0].path);
            return false;
        }

        // add project
        var dirs = [],
            files = [],
            activeProjectSrc = $('#projects .active').data('src'),
            pid = $('#projects .active').data('id'),
            inProjetFolder;

        for (var i = 0; i < items.length; ++i) {
            var itemPath = items[i].path;

            //get dirs
            if (fs.statSync(itemPath).isDirectory()) {

                dirs.push(itemPath);
                if (itemPath.indexOf(activeProjectSrc) > -1 && itemPath !== activeProjectSrc) {
                    inProjetFolder = true;
                }

            } else {
                if (!activeProjectSrc) {
                    continue;
                }
                //get files
                if (itemPath.indexOf(activeProjectSrc) > -1) {
                    files.push(itemPath);
                    inProjetFolder = true;
                }
            }
        }

        //drag items is in active project
        if (inProjetFolder) {
            //add files to active project
            dirs.forEach(function (item) {
                files = files.concat(projectManager.walkDirectory(item));
            });

            addFileItem(files, pid);

        } else if (dirs.length) {
            //create new project
            dirs.forEach(function (item) {
                addProject(item);
            });
        } else {
            $.koalaui.tooltip('warn',il8n.__('Please select a folder.'))
        }
    }
})();

//delete project
$('#folders').bind('deleteItem', function (event, deleteId) {
    var activeProjectElem = $('#' + deleteId);

    if (!activeProjectElem[0]) {
        return false;
    }

    var id = activeProjectElem.data('id');

    projectManager.deleteProject(id, function () {
        //show next project
        var nextItem;
        if (activeProjectElem.next().length > 0) {
            nextItem = activeProjectElem.next()
        }
        if (activeProjectElem.prev().length > 0) {
            nextItem = activeProjectElem.prev()
        }

        if (nextItem) {
            nextItem.trigger('click');
        } else {
            $('#files ul').html('');
            $('#addprojecttips').show();
        }

        //delete dom
        activeProjectElem.remove();
    });
});

//update project file list
$('#refresh').click(function () {
    var id = global.activeProject;

    if (!id) return false;

    var loading = $.koalaui.loading(),
        refreshBtn = $(this);

    refreshBtn.addClass('disable');

    projectManager.refreshProjectFileList(id, function (invalidFileIds, newFiles) {
        if (invalidFileIds.length > 0) {
            invalidFileIds.forEach(function (item) {
                $('#' + item).remove();
            });
        }

        if (newFiles.length > 0) {
            appendNewFilesHtml(newFiles);
        }

        refreshBtn.removeClass('disable');

        loading.hide();
        $.koalaui.tooltip('success', il8n.__('x new file', newFiles.length));
    });
});

//change project name
$(document).on('blur', '#folders .changeName', function () {
    var self = $(this),
        name = self.val(),
        target = self.parent(),
        id = target.attr('id');

    if (!name.trim()) {
        name = storage.getProjects()[id].name;
    }

    storage.getProjects()[id].name = name;
    storage.updateJsonDb();
    target.html(name);
});
$(document).on('keyup', '#folders .changeName', function (e) {
    if (e.which === 13) $(this).trigger('blur');
});