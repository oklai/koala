/**
 * application config module
 */

'use strict';

var fs          = require('fs'),
    path        = require('path'),
    exec        = require('child_process').exec,
    util        = require('./util'),
    FileManager = global.getFileManager(),
    $           = global.jQuery;

// get config from package.json
var appPackage = util.readJsonSync(FileManager.packageJSONFile) || {};

// default config of application
var appConfig = {};
    appConfig.languages = [];
    appConfig.builtInLanguages = [];
    appConfig.defaultIgnores = ["*.min", "min"];

// default config of user
var defaultUserConfig = {
    appVersion: appPackage.version,
    ignores: [], // default ignore file and dir
    includePaths: [],
    locales: 'en_us', // default locales
    minimizeToTray: true,
    minimizeOnStartup: false,
    notifyOnCompleted: false,
    useCustomRuby: false,
    rubyCommandPath: "",
    compilers: {}
};

var waitForReplaceFields = ['appVersion'];

/**
 * load user config
 */
function initUserConfig() {
    var config = getUserConfig(),
        syncAble;

    // sync app config
    syncAble = util.syncObject(config, defaultUserConfig) || syncAble;

    // replace the specified settings
    if (config.appVersion !== appPackage.version && waitForReplaceFields.length) {
        waitForReplaceFields.forEach(function (key) {
            config[key] = defaultUserConfig[key];
        });
        syncAble = true;
    }

    if (syncAble) {
        fs.writeFileSync(FileManager.settingsFile, JSON.stringify(config, null, '\t'));
    }

    //merge user config to global config
    for (var j in config) {
        appConfig[j] = config[j];
    }
}

/**
 * load user config
 * @return {Object} user config
 */
function getUserConfig() {
    //no user config, return null
    if (!fs.existsSync(FileManager.settingsFile)) {
        fs.appendFileSync(FileManager.settingsFile, JSON.stringify(defaultUserConfig, null, '\t'));
        return defaultUserConfig;
    }

    return util.readJsonSync(FileManager.settingsFile) || defaultUserConfig;
}

/**
 * load languages
 */
function loadLanguages () {
    var ret = require('./localesManager.js').loadLanguages();
    appConfig.builtInLanguages = (function () {
        return ret.builtIn.map(function (item) {
            return item.code
        });
    })();
    appConfig.languages = ret.all;

    // check the current locales if be removed
    var inLanguages = appConfig.languages.some(function (item) {
        return item.code ===  appConfig.locales;
    })
    if (!inLanguages) {
        appConfig.locales = defaultUserConfig.locales;
    }
}

/**
 * init compiler options
 * @param  {object} options compiler default options
 */
exports.initCompilerOptions = function (options) {
    var config = getUserConfig(), syncAble;
    
    for (var k in options) {
        if (!config.compilers[k]) {
            config.compilers[k] = options[k];
            syncAble = true;
        } else {
            syncAble = util.syncObject(config.compilers[k], options[k]) || syncAble;
        }
    }

    if (syncAble) {
        fs.writeFileSync(FileManager.settingsFile, JSON.stringify(config, null, '\t'));
    }

    //merge user config to global config
    for (var j in config.compilers) {
        appConfig.compilers[j] = config.compilers[j];
    }
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

/**
 * Get Global Settings Of Compiler
 * @param  {[type]} compilerName [description]
 * @return {[type]}              [description]
 */
exports.getGlobalSettingsOfCompiler = function (compilerName) {
    return appConfig.compilers[compilerName];
}

//module initialization
initUserConfig();
loadLanguages();