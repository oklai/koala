/**
 * locales manager
 */

'use strict';

var fs            = require('fs'),
	util          = require('./util.js'),
	il8n          = require('./il8n.js'),
	configManager = require('./appConfig.js'),
	appConfig     = configManager.getAppConfig(),
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
    var localesDir = appConfig.userDataFolder + '/locales/' + packageData.language_code;
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
 */
exports.getLocalesPackage = function (locales, callback) {
	var jsonPath, data;

    // Built-in language pack
	if (appConfig.builtInLanguages.join().indexOf(locales) > -1) {
		jsonPath = global.appRootPth + '/locales/' + locales + '/package.json';
	} else {
        // Installed language pack
		jsonPath = appConfig.userDataFolder + '/locales/' + locales + '/package.json';
	}

	fs.readFile(jsonPath, 'utf8', function (err, content) {
		content = util.replaceJsonComments(content);

		try {
			data = JSON.parse(content);
		} catch (e) {};

		callback(data);
	});
}