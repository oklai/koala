/**
 * application config module
 */

'use strict';

var fs          = require('fs'),
    path        = require('path'),
    exec        = require('child_process').exec,
    util        = require('./util'),
    FileManager = global.getFileManager(),
    compilersManager = require('./compilersManager.js'),
    $           = global.jQuery;

// get config from package.json
var appPackage = util.readJsonSync(FileManager.packageJSONFile) || {},
    languages = util.readJsonSync(path.join(FileManager.appLocalesDir, 'repositories.json')).languages;

// default config of application
var appConfig = {};
    appConfig.builtInLanguages = (function () {
        return languages.map(function (item) {
            return item.code
        });
    })();

// default config of user
var defaultUserConfig = {
    appVersion: appPackage.version,
    // filter file suffix
    filter: [],
    languages: languages,
    locales: 'en_us', // default locales
    minimizeToTray: true,
    minimizeOnStartup: false,
    useSystemCommand: {}
};

var waitForReplaceFields = ['languages', 'appVersion'];

/**
 * load user config
 */
function initUserConfig() {
    var config = getUserConfig() || {},
        syncAble;

    // sync app config
    util.syncObject(config, defaultUserConfig, function (result, flag) {
        if (flag) {
            config = result;
            syncAble = flag;
        }
    });

    // sync compiler default options
    var defaultOptions = compilersManager.getDefaultOptions();
    util.syncObject(config, defaultOptions, function (result, flag) {
        if (flag) {
            config = result;
            syncAble = flag;
        }
    });

    // replace the specified settings
    if (config.appVersion !== appPackage.version && waitForReplaceFields.length) {
        waitForReplaceFields.forEach(function (key) {
            config[key] = defaultUserConfig[key];
        });
        syncAble = true;
    }

    if (syncAble) {
        fs.writeFile(FileManager.settingsFile, JSON.stringify(config, null, '\t'));
    }

    //merge user config to global config
    for (var k in config) {
        appConfig[k] = config[k];
    }
}

/**
 * load user config
 * @return {Object} user config
 */
function getUserConfig() {
    //no user config, return null
    if (!fs.existsSync(FileManager.settingsFile)) {
        fs.appendFile(FileManager.settingsFile, JSON.stringify(defaultUserConfig, null, '\t'));
        return null;
    }

    return util.readJsonSync(FileManager.settingsFile);
}

/**
 * get app config
 * @return {Object} app config
 */
exports.getAppConfig = function () {
    return appConfig;
};

/**
 * get app package info
 * @return {Object} package object
 */
exports.getAppPackage = function () {
    return appPackage;
};

require('./ExtensionsManager').loadExtensions();

//module initialization
initUserConfig();