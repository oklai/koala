/**
 * set compile options
 */

'use strict';

//require lib
var path             = require('path'),
    EventProxy       = require('eventproxy'),
    storage          = require('../../storage.js'),
    projectsDb       = storage.getProjects(),
    compilersManager = require('../../compilersManager.js'),
    fileTypesManager = require('../../fileTypesManager.js'),
    projectManager   = require('../../projectManager.js'),
    jadeManager      = require('../../jadeManager.js'),
    fileWatcher      = require('../../fileWatcher.js'),
    il8n             = require('../../il8n.js'),
    $                = global.jQuery,
    document         = global.mainWindow.window.document;

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
    var outputType = path.extname(output).substring(1),
        fileSrc    = selectedItem.data('src'),
        file = projectsDb[pid].files[fileSrc];

    if (output.length === 0 || file.output === output) {
        return false;
    }

    var inputExt =  path.extname(file.src).substr(1),
        expectedOutputType = fileTypesManager.getFileTypeByExt(inputExt).output;

    if (outputType !== expectedOutputType) {
        $.koalaui.alert('please select a ".' + expectedOutputType + '" file');
        return false;
    }

    file.output = output;

    //update watch object
    fileWatcher.update({
        pid: pid,
        src: fileSrc
    });

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
    var activeProject = projectsDb[pid],
        changeList = [];

    selectedItems.each(function () {
        var src        = $(this).data('src'),
            targetFile = projectsDb[pid].files[src],
            oldOutput  = targetFile.output,
            name       = path.basename(oldOutput),
            newOutput;
            
        // remove '.min' suffix of static files (e.g css, js)
        if (path.extname(src) === path.extname(oldOutput) && path.dirname(src) !== outputDir) {
            name = name.replace('.min', '')
        }

        newOutput  = path.join(outputDir, name);
        targetFile.output = newOutput;

        changeList.push({
            pid: pid,
            src: src
        })

        var shortOutput = path.relative(activeProject.src, newOutput);
        $(this).find('.output span').text(shortOutput);
    })

    //update watch object
    fileWatcher.update(changeList);

    //save project data
    storage.updateJsonDb();
}

//bind file input change event
$('#ipt_fileOutput').change(function () {
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
$('#filelist').on('click', '.changeOutput', function () {
    var selectItem  = $(this).closest('.file_item');

    $('#ipt_fileOutput')
        .attr('nwWorkingDir', path.dirname(selectItem.data('src')))
        .trigger('click');

    $('#filelist').data('selectedItems', selectItem);
});


// toggle auto compile
// multiple file
$('#filelist').on('toggleAutoCompile', '.file_item', function () {
    var selectedItems = $('#filelist li.ui-selected:visible');

    if (!selectedItems.length) return false;

    var pid, fileSrc, self, updates = [];
    selectedItems.each(function (index) {
        self = $(this);

        if (!self.hasClass('nowatch')) {
            pid = self.data('pid');
            fileSrc = self.data('src');

            projectsDb[pid].files[fileSrc].compile = !projectsDb[pid].files[fileSrc].compile;
            updates.push({
                pid: pid,
                src: fileSrc
            });

            self.toggleClass('disable');
        }
    });

    if (updates.length) {
        //save project data
        storage.updateJsonDb();

        //update watch object
        fileWatcher.update(updates);
    }
});


// single file
$(document).on('change', '#compileSettings .compileStatus', function () {
    var fileId = $('#compileSettings').find('[name=id]').val(),
        fileSrc = $('#compileSettings').find('[name=src]').val(),
        pid = $('#compileSettings').find('[name=pid]').val(),
        fileItem = $('#' + fileId);

    projectsDb[pid].files[fileSrc].compile = this.checked;

    //save
    storage.updateJsonDb();

    //update watch object
    fileWatcher.update({
        pid: pid,
        src: fileSrc
    });

    fileItem.toggleClass('disable');
});

//set compile options
$(document).on('change', '#compileSettings .option_args', function (evt) {
    var elem = $(evt.target),
        optionName = elem.data('optionName'),
        changeValue = {settings: {}},
        fileSrc = $('#compileSettings').find('[name=src]').val(),
        pid = $('#compileSettings').find('[name=pid]').val();

    // for checkbox option
    if (elem[0].tagName.toLowerCase() === 'input') {
        changeValue.settings[optionName] = elem.is(':checked');
    }

    // for droplist option
    if (elem[0].tagName.toLowerCase() === 'select') {
        changeValue.settings[optionName] = elem[0].value;
    }
    

    projectManager.updateFile(pid, fileSrc, changeValue);
});

//run compile manually
function compileManually (src, pid) {
    var loading = $.koalaui.loading(il8n.__('compileing...')),
        emitter = new EventProxy();

    // Add listeners
    emitter.on('done', function () {
        $.koalaui.tooltip('Success');
    }).on('fail', function () {
        $.koalaui.tooltip('Error');
    }).on('always', function () {
        loading.hide();
    });

    compilersManager.compileFile(projectsDb[pid].files[src], emitter);
}

$(document).on('click', '#compileSettings .compileManually', function () {
    var src = $('#compileSettings').find('[name=src]').val(),
        pid = $('#compileSettings').find('[name=pid]').val();

    compileManually(src, pid);
});
$('#filelist').on('compile', '.file_item', function () {
    var selectedItems = $('#filelist li.ui-selected');

    if (!selectedItems.length) return false;

    //single selected item
    if (selectedItems.length === 1) {
        compileManually(selectedItems.data('src'), selectedItems.data('pid'));
        return false;
    }

    //multiple selected items
    var loading = $.koalaui.loading(il8n.__('compileing...')),
        totalCount = 0,
        errorCount = 0,
        successCount = 0,
        hasError = false,
        emitter = new EventProxy();

    // Add listeners
    emitter.on('done', function () {
        successCount++;
    }).on('fail', function () {
        hasError = true;
        errorCount++;
    }).on('always', function () {
        totalCount++;
        if (totalCount === selectedItems.length) {
            doComplete();
        }
    });


    function doComplete () {
        if (hasError) {
            $.koalaui.alert(il8n.__('Some Compile errors, please see the compile log', successCount, errorCount));
        } else {
            $.koalaui.tooltip('Success');
        }
        loading.hide();
    }

    selectedItems.each(function () {
        var self = $(this),
            pid = self.data('pid'),
            src = self.data('src');

        compilersManager.compileFile(projectsDb[pid].files[src], emitter);
    });

});


//show compile settings panel
$('#filelist').on('setCompileOptions', '.file_item', function () {
    var pid = $(this).data('pid'),
        src = $(this).data('src');

    var settingsHtml = jadeManager.renderSettings(projectsDb[pid].files[src]);

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

// fix when compile settings panel is hidden do not focus in it
$(document).on('focusin', '#extend input', function () {
    if (!$('#extend').hasClass('show')) this.blur();
});