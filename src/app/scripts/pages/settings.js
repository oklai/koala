/**
 * settings window
 */

'use strict';

var path        = require('path'),
    fs          = require('fs'),
    FileManager = global.getFileManager();

//Add error event listener
window.addEventListener('error', function (err) {
    var message = '---error---\n' + err.filename + ':' + err.lineno + '\n' + err.message + '\n\n';
    fs.appendFile(FileManager.errorLogFile, message);
    alert(message);
}, false);

var configManger      = require(FileManager.appScriptsDir + '/appConfigManager.js'),
    jadeManager       = require(FileManager.appScriptsDir + '/jadeManager.js'),
    FileManager       = require(FileManager.appScriptsDir + '/FileManager.js'),
    util              = require(FileManager.appScriptsDir + '/util.js'),
    il8n              = require(FileManager.appScriptsDir + '/il8n.js'),
    gui               = require('nw.gui'),
    appConfig         = configManger.getAppConfig(),
    appPackage        = configManger.getAppPackage(),
    hasChange         = false,
    userConfigFile    = FileManager.settingsFile,
    settings          = util.readJsonSync(userConfigFile),
    k;

//render page
//distinguish between different platforms
$('body').addClass(process.platform);

$('#inner').html(jadeManager.renderAppSettings());

// depand options
$('.compile_option[data-depend]').each(function () {
    var self = $(this),
        rel = self.data('rel') + '_' + self.data('depend'),
        dependItem = $('#' + rel);

    self.attr('disabled', !dependItem[0].checked)

    dependItem.change(function () {
        self.attr('disabled', !this.checked);
    })
});

//open external link
$(document).on('click', '.externalLink', function () {
    gui.Shell.openExternal($(this).attr('href'));
    return false;
});

// bind compilation options change event
$('.compile_option').change(function () {
    var name = $(this).data('name'),
        rel  = $(this).data('rel'),
        type = $(this).data('type'),
        value = this.type === 'checkbox' ? this.checked : this.value.trim();

    if (rel === 'global') {
        settings[name] = value;
    } else {
        settings.compilers[rel][type][name] = value;    
    }

    hasChange = true;
});

//set ignores && includePaths
$('#ignores, #includePaths').change(function () {
    var name = $(this).data('name'),
        val = $(this).val().trim();

    if (val !== settings[name].join()) {
        if (!val) {
            settings[name] = []
        } else {
            settings[name] = val.split(',').map(function (item) {
                return item.trim();
            });
        }
        hasChange = true;
    }
});

//set locales
$('#locales').change(function () {
    settings.locales = this.value;
    hasChange = true;
});

//set minimize action
$('#minimizeToTray, #minimizeOnStartup').change(function () {
    settings[this.id] = this.checked;
    hasChange = true;
});

// Open Extentions Folder
$('#openExtsFolder').click(function() {
    gui.Shell.openExternal(FileManager.userExtensionsDir);
});

// uninstall extenstions
$('.uninstall').click(function() {
    // TODO
});

//Check Upgrade
function checkUpgrade () {
    $('#upgradeloading').show();

    var url = appPackage.maintainers.upgrade,
        currentVersion = appPackage.version;

    util.checkUpgrade(url, currentVersion, function (data, hasNewVersion) {
        if (hasNewVersion) {
            $('#newVersion').html(data.version);
            $('#upgradetips .update').show();
            $('#link_download').attr('href', data.download[appConfig.locales] || data.download.en_us);
        } else {
            $('#upgradetips .noupdate').show();
        }

    }, {
        success: function () {
            $('#upgradeloading').hide();
        },
        fail: function () {
            $('#upgradeloading').hide();
            alert(il8n.__('Network requests failed, please try again'));
        }
    });
}

$('#checkupgrade').click(checkUpgrade);

var saveSettings = function () {
    if (hasChange) {
        fs.writeFileSync(userConfigFile, JSON.stringify(settings, null, '\t'));

        //effective immediately
        delete settings.locales;
        for (var k in settings) {
            appConfig[k] = settings[k];
        }
    }
}
// save settings
$('#ok').click(function () {
    saveSettings();
    parent.hideFrame();
});

// turn tab
$('#nav li').click(function () {
    if ($(this).hasClass('current')) return false;

    var rel = $(this).data('rel');
    $($('#nav li.current').data('rel')).hide();
    $(rel).show();

    $('.current').removeClass('current');
    $(this).addClass('current');
});

// close window
$('#cancel').click(function () {
    parent.hideFrame();
});
$(document).keydown(function (e) {
    if (e.which === 27) {
        parent.hideFrame();
    }
});
$('#titlebar .close').click(function () {
    parent.hideFrame();
});

