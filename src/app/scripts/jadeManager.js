/**
 * render page content from jade template
 */

"use strict";

var jade           = require("jade"),
    fs             = require("fs"),
    path           = require('path'),
    util           = require('./util'),
    storage        = require('./storage.js'),
    configManager  = require('./appConfigManager'),
    fileTypesManager = require('./fileTypesManager'),
    compilersManager = require('./compilersManager'),
    $              = global.jQuery,
    localStorage   = global.mainWindow.window.localStorage;

/**
 * render project list
 * @param  {Array} data  projects data
 * @return {Object}      project list elements
 */
exports.renderFolders  = function (data) {
    var fn = jade.compile(localStorage.getItem('jade-main-folders'), {filename: localStorage.getItem('fileNameOf-jade-main-folders')});
    return fn({folders: data});
};

/**
 * render file list
 * @param  {Array}  data files data
 * @return {Object} file list elements
 */
exports.renderFiles  = function (data) {
    var pid = data[0].pid,
        projectDir = storage.getProjects()[pid].src;

    //shorten the path
    data.forEach(function (item) {
        item.icon = fileTypesManager.fileTypeForExtension(path.extname(item.src).substr(1)).icon;
        item.shortSrc = path.relative(projectDir, item.src);
        item.shortOutput = path.relative(projectDir, item.output);
    });

    var fn = jade.compile(localStorage.getItem('jade-main-files'), {filename: localStorage.getItem('fileNameOf-jade-main-files')});
    return fn({files: data});
};

/**
 * render file settings
 * @param  {Object} file data
 * @return {Object} file elements
 */
exports.renderSettings = function (file) {
    var compiler = compilersManager.getCompilerForFileType(file.type),
        options = [];

    file.name = path.basename(file.src);

    var fn = jade.compile(localStorage.getItem('jade-main-settings'), {filename: localStorage.getItem('fileNameOf-jade-main-settings')});
    return $(fn({file: file, options: compiler.options, compilerName: compiler.display}));
};

/**
 * render app settings
 * @return {Object} setting elements
 */
exports.renderAppSettings = function () {
    var appConfig = configManager.getAppConfig(),
        appPackage = configManager.getAppPackage(),
        translator  = require('./localesManager.js').getLocalesPackage(appConfig.locales).translator,
        compilers =  compilersManager.getCompilersAsArray();

    compilers.forEach(function (compiler) {
        // apply global default options
        if (appConfig[compiler.name]) {
            var globalOptions = appConfig[compiler.name];
            compiler.options.forEach(function (option) {
                option.value = globalOptions[option.name];
            });
        }
    });

    var fn = jade.compile(localStorage.getItem('jade-settings-inner'), {filename: localStorage.getItem('fileNameOf-jade-settings-inner')});

    return $(fn({
        compilers: compilers,
        languages: appConfig.languages,
        translator: translator,
        maintainers: appPackage.maintainers,
        appVersion: appPackage.version
    }));
};
