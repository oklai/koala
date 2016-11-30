/**
 * main window contextmenu
 */

"use strict";

var path             = require('path'),
    fs               = require('fs-extra'),
    compilersManager = require('./compilersManager.js'),
    projectManager   = require('./projectManager.js'),
    projectSettings  = require('./projectSettings.js'),
    il8n             = require('./il8n.js'),
    $                = global.jQuery,
    document         = global.mainWindow.window.document;

/**
 * folder contextmenu
 */
var folderMenu = global.newMenu(),
    currentContextFolderId;

folderMenu.append(new nw.MenuItem({
    label: il8n.__('Open Folder'),
    click: function () {
        var src = $('#' + currentContextFolderId).data('src');
        nw.Shell.showItemInFolder(src);
    }
}));

//Project Settings
var projectSettingsMenu = new nw.MenuItem({label: il8n.__('Project Settings')});

//Create a project settings file
var createSettingsMenu = new nw.MenuItem({label: il8n.__('New Settings')});
var createSubmenu = global.newMenu();

createSubmenu.append(new nw.MenuItem({
    label: il8n.__('Default'),
    click: function () {
        createSettings('default');
    }
}));
compilersManager.getCompilersAsArray().forEach(function (item) {
    if (item.projectSettings || item.name === 'compass') {
        createSubmenu.append(new nw.MenuItem({
            label: il8n.__('For ' + item.display),
            click: function () {
                createSettings(item.name);
            }
        }));
    }
});

createSettingsMenu.submenu = createSubmenu;

// Edit Settings
var projectSubmenu = global.newMenu();
    projectSubmenu.append(createSettingsMenu);
    projectSubmenu.append(new nw.MenuItem({
        label: il8n.__('Edit Settings'),
        click: function () {
            //TODO:: make this part compiler agnostic
            var projectDir = $('#' + currentContextFolderId).data('src'),
                koalaConfig = path.join(projectDir, 'koala-config.json');

            if (fs.existsSync(path.join(projectDir, 'config.rb'))) {
                nw.Shell.openItem(path.join(projectDir, 'config.rb'));
                return false;
            }

            if (!fs.existsSync(koalaConfig)) {
                $.koalaui.alert(il8n.__('koala-config.json not found, please create it first.'));
                return false;
            }

            nw.Shell.openItem(koalaConfig);
        }
    }));
    projectSettingsMenu.submenu = projectSubmenu;

folderMenu.append(projectSettingsMenu);
folderMenu.append(new nw.MenuItem({
    label: il8n.__('Reload'),
    click: function () {
        var loading = $.koalaui.loading();
        projectManager.reloadProject(currentContextFolderId, function () {
            $('#' + currentContextFolderId).trigger('reload');
            $.koalaui.tooltip('Success');
        });
        loading.hide();
    }
}));

folderMenu.append(new nw.MenuItem({type: 'separator'}));
folderMenu.append(new nw.MenuItem({
    label: il8n.__('Rename'),
    click: function () {
        var target = $('#' + currentContextFolderId);
        var oldName = target.text(),
            input = $('<input class="changeName"/>').val(oldName).focus();

        target.html(input);
        input.focus();
        target.trigger('click');
    }
}));

folderMenu.append(new nw.MenuItem({type: 'separator'}));
folderMenu.append(new nw.MenuItem({
    label: il8n.__('Delete'),
    click: function () {
        $('#folders').trigger('deleteItem',[currentContextFolderId]);
    }
}));

//bind folders  contextmenu  event
$(document).on('contextmenu', '#folders li', function (e) {
    currentContextFolderId = $(this).data('id');
    folderMenu.popup(e.pageX, e.pageY);
    return false;
});

/**
 * single selected file item contextmenu
 */
var fileMenuOfSingle = global.newMenu(),
    currentContextFileId;

//Open The File With Default Edit App
fileMenuOfSingle.append(new nw.MenuItem({
    label: il8n.__('Open File'),
    click: function () {
        var src = $('#' + currentContextFileId).data('src');
        nw.Shell.openItem(src);
    }
}));

// Open Containing Folder
fileMenuOfSingle.append(new nw.MenuItem({
 label: il8n.__('Open Containing Folder'),
 click: function () {
     var src = $('#' + currentContextFileId).data('src');
     nw.Shell.showItemInFolder(src);
 }
}));

// Open Output Folder
fileMenuOfSingle.append(new nw.MenuItem({
 label: il8n.__('Open Output Folder'),
 click: function () {
     var dir = $('#folders .active').data('src'),
         name = $('#' + currentContextFileId).find('.output span').text();

     var src = path.resolve(dir, name);
     if (fs.existsSync(src)) {
         nw.Shell.showItemInFolder(src);
     } else {
         nw.Shell.showItemInFolder(path.dirname(src));
     }
 }
}));

//Set Output Path
fileMenuOfSingle.append(new nw.MenuItem({
    label: il8n.__('Set Output Path'),
    click: function () {
        $('#' + currentContextFileId).trigger('setOutputPath');
    }
}));

//compile File Item
fileMenuOfSingle.append(new nw.MenuItem({type: 'separator'}));
fileMenuOfSingle.append(new nw.MenuItem({
    label: il8n.__('Compile'),
    click: function () {
        $('#' + currentContextFileId).trigger('compile')
    }
}));

//Delete File Item
fileMenuOfSingle.append(new nw.MenuItem({type: 'separator'}));
fileMenuOfSingle.append(new nw.MenuItem({
    label: il8n.__('Remove'),
    click: function () {
        $('#' + currentContextFileId).trigger('removeFileItem')
    }
}));


/**
 * Multiple selected file item contextmenu
 */
var fileMenuOfMultiple = global.newMenu();
fileMenuOfMultiple.append(new nw.MenuItem({
    label: il8n.__('Set Output Path'),
    click: function () {
        $('#' + currentContextFileId).trigger('setOutputPath');
    }
}));

fileMenuOfMultiple.append(new nw.MenuItem({
    label: il8n.__('Toggle Auto Compile'),
    click: function () {
        $('#' + currentContextFileId).trigger('toggleAutoCompile');
    }
}));

fileMenuOfMultiple.append(new nw.MenuItem({type: 'separator'}));

fileMenuOfMultiple.append(new nw.MenuItem({
    label: il8n.__('Compile'),
    click: function () {
        $('#' + currentContextFileId).trigger('compile')
    }
}));

fileMenuOfMultiple.append(new nw.MenuItem({type: 'separator'}));

fileMenuOfMultiple.append(new nw.MenuItem({
    label: il8n.__('Remove'),
    click: function () {
        $('#' + currentContextFileId).trigger('removeFileItem')
    }
}));

//bind folders  contextmenu  event
$(document).on('contextmenu', '#filelist li' ,function (e) {
    currentContextFileId = $(this).data('id');

    if ($('#filelist li.ui-selected').length <= 1) {
        $('#filelist li.ui-selected').removeClass('ui-selected');
        $(this).addClass('ui-selected');
        fileMenuOfSingle.popup(e.pageX, e.pageY);
    } else {
        fileMenuOfMultiple.popup(e.pageX, e.pageY);
    }
    return false;
});

/**
 * create a settings file
 * @param  {String} name compiler name
 */
function createSettings (name) {
    var loading = $.koalaui.loading(),
        target = $('#' + currentContextFolderId).data('src'),
        dest = projectSettings.getConfigFilePath(name, target),
        settingsFileName = path.basename(dest);

    //config file already exists
    if (fs.existsSync(dest)) {
        loading.hide();
        var tips = il8n.__('Settings file has already exists. Do you want to edit it?', settingsFileName);
        $.koalaui.confirm(tips, function () {
            nw.Shell.openItem(dest);
        });
        return false;
    }

    //create a new config file
    projectSettings.create(name, target, currentContextFolderId, function (settings) {
        loading.hide();
        var tips = il8n.__('Settings file was created in the project directory. Do you want to edit it now?', settingsFileName);
        $.koalaui.confirm(tips, function () {
            nw.Shell.openItem(settings);
        });
    });
}