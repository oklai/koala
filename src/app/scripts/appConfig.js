/**
 * application config module
 */

'use strict';

var fs          = require('fs'),
    path        = require('path'),
    exec        = require('child_process').exec,
    util        = require('./util'),
    FileManager = global.getFileManager(),
    newCompilersManager = require('./compilersManager.new.js'),
    $           = global.jQuery;

// get config from package.json
var appPackage = util.readJsonSync(FileManager.packageJSONFile) || {};

// default config of application
var appConfig = {
    builtInLanguages: ['en_us', 'zh_cn', 'ja_jp', 'de_de']
};

// default config of user
var defaultUserConfig = {
    appVersion: appPackage.version,
    // filter file suffix
    filter: [],
    languages: [{
        name: 'English',
        code: 'en_us'
    },
    {
        name: '简体中文',
        code: 'zh_cn'
    },
    {
        name: '日本語',
        code: 'ja_jp'
    },
    {
        name: 'Deutsch',
        code: 'de_de'
    }],
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
    var config = getUserConfig() || {};

    // sync app config
    var i, j, syncAble = false;
    for (j in defaultUserConfig) {
        if (config[j] === undefined) {
            config[j] = defaultUserConfig[j];
            syncAble = true;
        } else {
            if (util.isObject(config[j])) {
                for (i in defaultUserConfig[j]) {
                    if (config[j][i] === undefined) {
                        config[j][i] = defaultUserConfig[j][i];
                        syncAble = true;
                    }
                }
            }
        }
    }

    // sync compiler default options
    var defaultOptions = newCompilersManager.getDefaultOptions();
    for (j in defaultOptions) {
        if (config[j] === undefined) {
            config[j] = defaultOptions[j];
            syncAble = true;
        } else {
            if (util.isObject(config[j])) {
                for (i in defaultOptions[j]) {
                    if (config[j][i] === undefined) {
                        config[j][i] = defaultOptions[j][i];
                        syncAble = true;
                    }
                }
            }
        }
    }

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

    //detect if satisfy ruby runtime environment
    //checkModulesAvailable();
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
 * check for module available status
 */
function checkModulesAvailable() {
    //check for ruby and compiler
    ['ruby', 'sass', 'lessc', 'coffee'].forEach(function (item) {
        var command = item + ' -v',
            key = item + 'Available';

        exec(command, {timeout: 5000}, function (error) {
            if (error !== null) {
                appConfig[key] = false;
            } else {
                appConfig[key] = true;
            }
        });
    });
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
}

require('./ExtensionsManager').loadExtensions();
//module initialization
initUserConfig();