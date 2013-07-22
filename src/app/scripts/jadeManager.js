/**
 * render page content from jade template
 */

"use strict";

var jade           = require("jade"),
    fs             = require("fs"),
    path           = require('path'),
    storage        = require('./storage.js'),
    configManager  = require('./appConfigManager.js'),
    compilersManager = require('./compilersManager.js'),
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
        parentSrc = storage.getProjects()[pid].src,
        ext;

    //shorten the path
    data.forEach(function (item) {
        item.shortSrc = path.relative(parentSrc, item.src);
        item.shortOutput = path.relative(parentSrc, item.output);
        
        ext = path.extname(item.src).substr(1);
        item.icon = compilersManager.getFileTypeByExt(ext).icon;
    });

    var fn = jade.compile(localStorage.getItem('jade-main-files'), {filename: localStorage.getItem('fileNameOf-jade-main-files')});
    return fn({files: data, parentSrc: parentSrc});
};

/**
 * render file settings
 * @param  {Object} file data
 * @param  {FileType} fileType file type
 * @param  {Compiler} compiler
 * @return {Object} file elements
 */
exports.renderSettings = function (file) {
    var compiler = compilersManager.getCompilerByName(file.type),
        options = [],
        settings = file.settings;

    // get display options
    compiler.options.forEach(function (item) {
        if (settings.hasOwnProperty(item.name)) {
            item.value = settings[item.name];
        } else {
            item.value = item.default;
        }
        options.push(item);
    });

    file.name = path.basename(file.src);

    var fn = jade.compile(localStorage.getItem('jade-main-settings'), {filename: localStorage.getItem('fileNameOf-jade-main-settings')});
    
    return $(fn({file: file, options: options, compilerName: compiler.display}));
};

/**
 * render app settings
 * @param  {Object} compilers   all compilers
 * @param  {Array}  languages   [description]
 * @param  {Object} translator  [description]
 * @param  {Object} maintainers [description]
 * @param  {String} appVersion  [description]
 * @return {Object}             setting elements
 */
exports.renderAppSettings = function () {
    var appConfig = configManager.getAppConfig(),
        appPackage = configManager.getAppPackage(),
        translator  = require('./localesManager.js').getLocalesPackage(appConfig.locales).translator,
        compilers =  compilersManager.getCompilersAsArray(),
        commands = [],
        libraries = [];

    compilers.forEach(function (item) {
        commands = commands.concat(item.commands);
        libraries = libraries.concat(item.libraries);

        // apply global default options
        if (appConfig[item.name]) {
            var globalOptions = appConfig[item.name];
            item.options.forEach(function (item) {
                item.value = globalOptions[item.name];
            });
        }
    });

    // parse libraries
    libraries = libraries.map(function (item) {
        var lib = item.split('-');
        return {
            name: lib[0],
            version: lib[1]
        };
    });

    var fn = jade.compile(localStorage.getItem('jade-settings-inner'), {filename: localStorage.getItem('fileNameOf-jade-settings-inner')});
    
    return $(fn({
        compilers: compilers,
        commands: commands,
        libraries: libraries,
        languages: appConfig.languages,
        translator: translator,
        maintainers: appPackage.maintainers,
        appVersion: appPackage.version
    }));
};
