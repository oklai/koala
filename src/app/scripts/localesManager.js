/**
 * locales manager
 */

'use strict';

var fs            = require('fs'),
    path          = require('path'),
    util          = require('./util.js'),
    il8n          = require('./il8n.js'),
    configManager = require('./appConfig.js'),
    appConfig     = configManager.getAppConfig(),
    FileManager   = global.getFileManager(),
    $             = jQuery;

exports.install = function (pack) {
    var loading = $.koalaui.loading(il8n.__('Installing the language pack...'));

    // reading archives
    var AdmZip = require('adm-zip'),
        zip = new AdmZip(pack),
        zipEntries = zip.getEntries(),
        viewsJson,
        contextJson,
        packageJson,
        packageContent,
        packageData;

    for (var i = 0; i < zipEntries.length; i++) {
        var zipEntry = zipEntries[i],
            entryName = zipEntry.entryName;

        if (entryName === 'views.json') {
            viewsJson = true;
            continue;
        }

        if (entryName === 'context.json') {
            contextJson = true;
            continue;
        }

        if (entryName === 'package.json') {
            packageJson = true;
            packageContent = zipEntry.getData().toString('utf8');
            continue;
        }
    }

    var showError = function (message) {
        loading.hide();
        message = il8n.__('Install the language pack failed:') + '<br>' + il8n.__(message);
        $.koalaui.alert(message);
    }

    if (!packageJson) {
        showError('Not found the package.json file.');
        return false;
    }

    if (!viewsJson || !contextJson) {
        showError('Language pack is not complete.');
        return false;
    }

    // parse package content
    packageContent = util.replaceJsonComments(packageContent);
    try {
        packageData = JSON.parse(packageContent);
    } catch (e) {
        packageData = {};
    }

    var languageName = packageData.language_name,
        languageCode = packageData.language_code;
    if (!packageData || !languageName || !languageCode) {
        showError('Package.json is not complete.');
        return false;
    }

    // install the language pack
    var localesDir = path.join(FileManager.userLocalsDir, packageData.language_code);
    zip.extractAllTo(localesDir, true);

    // add new language to settings.json
    fs.readFile(appConfig.userConfigFile, 'utf8', function (err, content) {
        var appSettings = JSON.parse(content);

        // if exists
        var exists = appSettings.languages.some(function (item) {
            return item.code === languageCode;
        })

        if (!exists) {
        appSettings.languages.push({
            name: languageName,
            code: languageCode
        });
        }

        fs.writeFileSync(appConfig.userConfigFile, JSON.stringify(appSettings, null, '\t'));

        loading.hide();
        $.koalaui.tooltip('success', il8n.__('Language pack is installed successfully.', languageName));
    });
};

/**
 * get locales package data
 * @param  {String}   locales   locales code
 * @param  {Function} callback
 * @return {Object}   locales package data
 */
exports.getLocalesPackage = function (locales, callback) {
    var localsDir, jsonPath;

    if (appConfig.builtInLanguages.indexOf(locales) > -1) {
        // Built-in language pack
        localsDir = FileManager.appLocalesDir;
    } else {
        // Installed language pack
        localsDir = FileManager.userLocalesDir;
    }
    jsonPath = path.join(localsDir, locales, 'package.json');

    return util.readJsonSync(jsonPath);
}

/**
 * detect language pack update
 */
exports.detectUpdate = function () {
    var locales = appConfig.locales;

    // Not delect for built-in language pack
    if (appConfig.builtInLanguages.indexOf(locales) > -1) return false;

    function getVersionNum(version) {
        var numList = version.split('.'),
            versionNum = 0,
            multiple = 100;

        for (var i = 0;i < 3; i++) {
            if (numList[i] !== undefined) {
                versionNum += numList[i] * multiple;
                multiple = multiple / 10;
            }
        }

        return versionNum;
    }

    var url = configManager.getAppPackage().maintainers.locales_repositories + '?' + util.createRdStr();
    $.getJSON(url, function (data) {
        if (data[locales]) {
            var curLocales = exports.getLocalesPackage(locales),
                curVersion = curLocales.app_version,
                newVersion = data[locales].app_version;

            if (getVersionNum(newVersion) > getVersionNum(curVersion)) {
               $.koalaui.confirm(il8n.__('language pack update notification', curLocales.language_name), function () {
                    installNewVersion(data[locales].download);
               });
            }
        }
    });
}

/**
 * install the new version language pack
 * @param  {String} fileUrl
 */
function installNewVersion (fileUrl) {
    var loading = $.koalaui.loading(il8n.__('Downloading the new language pack...'));
    util.downloadFile(fileUrl, FileManager.tmpDir(), function (filePath) {
        loading.hide();
        exports.install(filePath);
    }, function (err) {
        loading.hide();

        err = il8n.__('Language pack auto download failed, try download it manually.') + '<br>Error: ' + err;
        $.koalaui.alert(err, function () {
            global.gui.Shell.openExternal(fileUrl);
        });
    });
}
