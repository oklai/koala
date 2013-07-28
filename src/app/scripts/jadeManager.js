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
    localStorage   = global.localStorage;


/**
 * translate option's visible property
 * @param  {string} text
 * @return {string} translated text
 */
var viewsJsonData = JSON.parse(localStorage.getItem('locales-viewsJson') || '{}');
var translate = function (text) {
    return viewsJsonData[text] || text;
}

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
        options  = [],
        settings = file.settings;

    // get display options
    compiler.options.forEach(function (option) {
        if (settings.hasOwnProperty(option.name)) {
            option.value = settings[option.name];
        } else {
            option.value = option.default;
        }
        options.push(option);
    });

    file.name = path.basename(file.src);

    var fn = jade.compile(localStorage.getItem('jade-main-settings'), {filename: localStorage.getItem('fileNameOf-jade-main-settings')});
    return fn({file: file, options: options, compilerName: compiler.display, __: translate });
};

/**
 * render app settings
 * @return {Object} setting elements
 */
exports.renderAppSettings = function () {
    var appConfig  = configManager.getAppConfig(),
        appPackage = configManager.getAppPackage(),
        translator = require('./localesManager.js').getLocalesPackage(appConfig.locales).translator,
        compilers  = compilersManager.getCompilersAsArray();

    compilers.forEach(function (compiler) {
        var compilerName = compiler.name;
        // apply global default options
        if (appConfig.compilers[compilerName]) {
            var globalSettings = configManager.getGlobalSettingsOfCompiler(compilerName);
            compiler.options.forEach(function (option) {
                option.value = globalSettings.options[option.name];
            });
            compiler.advanced.forEach(function (option) {
                option.value = globalSettings.advanced[option.name];
            });
        }
    });

    var fn = jade.compile(localStorage.getItem('jade-settings-inner'), {filename: localStorage.getItem('fileNameOf-jade-settings-inner')});

    return fn({
        compilers: compilers,
        translator: translator,
        appPackage: appPackage,
        appConfig: appConfig,
        __: translate
    });
};
