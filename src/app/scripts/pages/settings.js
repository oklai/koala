/**
 * settings window
 */

'use strict';

var path = require('path'),
    fs   = require('fs');

//Add error event listener
var errorLog = process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'] + '/.koala/error.log';
window.addEventListener('error', function (err) {
    var message = '---error---\n' + err.filename + ':' + err.lineno + '\n' + err.message + '\n\n';
    fs.appendFile(errorLog, message);
    alert(message);
}, false);

var configManger      = require(global.appRootPth + '/scripts/appConfig.js'),
    localesManager    = require(global.appRootPth + '/scripts/localesManager.js'),
    appConfig         = configManger.getAppConfig(),
    appPackage        = configManger.getAppPackage(),
    hasChange         = false,
    userConfigFile    = appConfig.userConfigFile,
    userConfigContent = fs.readFileSync(userConfigFile, 'utf8'),
    settings          = JSON.parse(userConfigContent),
    jadeManager       = require(global.appRootPth + '/scripts/jadeManager.js'),
    compilersManager  = require(global.appRootPth + '/scripts/compilersManager.js'),
    util              = require(global.appRootPth + '/scripts/util.js'),
    il8n              = require(global.appRootPth + '/scripts/il8n.js'),
    gui               = require('nw.gui');

//render page
(function () {
    //distinguish between different platforms
    $('body').addClass(process.platform);
    $('#inner').html(jadeManager.renderAppSettings(compilersManager.getCompilers(), settings.languages, localesManager.getLocalesPackage(settings.locales).translator, appPackage.maintainers, appPackage.version));

    $.each(compilersManager.getCompilers(), function (compilerName, compiler) {
        $('#' + compilerName + '_outputStyle').find('[value=' + settings[compilerName].outputStyle + ']').prop('selected', true);
        for (var k in settings[compilerName]) {
            $('#' + compilerName + '_' + k).prop('checked', settings[compilerName][k]);
        }
    });

    //use system command
    for (var k in settings.useSystemCommand) {
        $('#systemcommand_' + k).prop('checked', settings.useSystemCommand[k]);
    }

    //locales
    $('#locales').find('[name='+ settings.locales +']').prop('selected', true);

    //minimize to tray
    $('#minimizeToTray').prop('checked', settings.minimizeToTray);

    //minimize on startup
    $('#minimizeOnStartup').prop('checked', settings.minimizeOnStartup);

    //filter
    $('#filter').val(settings.filter.join());

    //open external link
    $(document).on('click', '.externalLink', function () {
        gui.Shell.openExternal($(this).attr('href'));
        return false;
    });
})();

$.each(compilersManager.getCompilers(), function (compilerName, compiler) {

    $('#' + compilerName + '_outputStyle').change(function () {
        settings[compilerName].outputStyle = $(this).val();
        hasChange = true;
    });

    $('#' + compilerName + '_options').find(':checkbox').change(function () {
        var name = this.name,
            rel  = $(this).data('rel');
        settings[rel][name] = this.checked;
        hasChange = true;
    });
});

//set use system command enable
$('#systemcommand_options').find(':checkbox').change(function () {
    var id = $(this).attr('id'),
        rel = id.replace('systemcommand_', '');

    settings.useSystemCommand[rel] = this.checked;
    hasChange = true;
})

//set filter
$('#filter').keyup(function () {
    if ($(this).val() !== settings.filter.join()) hasChange = true;
})

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
        var filterString = $('#filter').val().trim();
        if (!filterString) {
            settings.filter = []
        } else {
            settings.filter = filterString.split(',');
        }

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
$('#titlebar .close').click(function() {
    parent.hideFrame();
});

