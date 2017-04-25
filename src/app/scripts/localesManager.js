/**
 * locales manager
 */

'use strict';

var fs            = require('fs'),
    path          = require('path'),
    util          = require('./util.js'),
    il8n          = require('./il8n.js'),
    configManager = require('./appConfigManager.js'),
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
    packageData = util.parseJSON(packageContent);

    var languageName = packageData.languageName,
        languageCode = packageData.languageCode;
    if (!packageData || !languageName || !languageCode) {
        showError('Package.json is not complete.');
        return false;
    }

    // install the language pack
    var localesDir = path.join(FileManager.userLocalesDir, packageData.languageCode);
    zip.extractAllTo(localesDir, true);

    // add new language to appConfig
    appConfig.languages.push({
        name: languageName,
        code: languageCode
    });

    loading.hide();
    $.koalaui.tooltip('success', il8n.__('Language pack is installed successfully.', languageName));
};

/**
 * get locales package data
 * @param  {String}   locales   locales code
 * @return {Object}   locales package data
 */
exports.getLocalesPackage = function (locales) {
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

    var appPackage = configManager.getAppPackage(),
        url = appPackage.maintainers.locales_repositories + '?' + util.createRdStr();

    $.getJSON(url, function (data) {
        if (data[locales]) {
            var newLocales = data[locales],
                curLocales = exports.getLocalesPackage(locales),
                curVersion = util.parseVersion(curLocales.version),
                curKoalaVersion = util.parseVersion(appPackage.version.replace(/-.*/, '')),
                newVersion = util.parseVersion(newLocales.version),
                targetKoalaVersion = util.parseVersion(newLocales.koalaVersion.replace(/>=|-.*/, ''));

            if (newVersion > curVersion && curKoalaVersion >= targetKoalaVersion) {
               $.koalaui.confirm(il8n.__('language pack update notification', curLocales.languageName), function () {
                    installNewVersion(newLocales.download);
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
            nw.Shell.openExternal(fileUrl);
        });
    });
}

/**
 * load all languages
 * @return {array} languages
 */
exports.loadLanguages = function () {
    var ret = {};

    // load built-in languages
    var languages = util.readJsonSync(path.join(FileManager.appLocalesDir, 'repositories.json')).languages;
    ret.builtIn = [].concat(languages);

    // load user languages
    var packages = FileManager.getAllPackageJSONFiles(FileManager.userLocalesDir),
        packData;

    packages.forEach(function (item) {
        packData = util.readJsonSync(item);
        languages.push({
            name: packData.languageName,
            code: packData.languageCode
        });
    });

    ret.all = languages;

    return ret;
}