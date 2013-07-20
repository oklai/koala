/**
 * render page content from jade template
 */

"use strict";

var jade           = require("jade"),
    fs             = require("fs"),
    path           = require('path'),
    storage        = require('./storage.js'),
    fileTypesManager = require('./fileTypesManager.js'),
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
        fileType;

    //shorten the path
    data.forEach(function (item) {
        fileType = fileTypesManager.fileTypeForExtension(item.extension);
        item.icon = fileType.icons[fileType.extensions.indexOf(item.extension)];
        item.shortSrc = path.relative(parentSrc, item.src);
        item.shortOutput = path.relative(parentSrc, item.output);
    });

    var fn = jade.compile(localStorage.getItem('jade-main-files'), {filename: localStorage.getItem('fileNameOf-jade-main-files')});
    return fn({files: data, parentSrc: parentSrc});
};

/**
 * render nav bar
 * @param  {Object} fileTypes all file types
 * @return {Object} nav elements
 */
exports.renderNav = function (fileTypes) {
    var fn = jade.compile(localStorage.getItem('jade-main-nav'), {filename: localStorage.getItem('fileNameOf-jade-main-nav')});
    return $(fn({fileTypes: fileTypes}));
};

/**
 * render file settings
 * @param  {Object} file data
 * @param  {FileType} fileType file type
 * @param  {Compiler} compiler
 * @return {Object} file elements
 */
exports.renderSettings = function (file, fileType, compiler) {
    file.name = path.basename(file.src);
    var fn = jade.compile(localStorage.getItem('jade-main-settings'), {filename: localStorage.getItem('fileNameOf-jade-main-settings')});
    return $(fn({file: file, type: fileType, compiler: compiler}));
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
exports.renderAppSettings = function (compilers, languages, translator, maintainers, appVersion) {
    var fn = jade.compile(localStorage.getItem('jade-settings-inner'), {filename: localStorage.getItem('fileNameOf-jade-settings-inner')});
    return $(fn({compilers: compilers, languages: languages, translator: translator, maintainers: maintainers, appVersion: appVersion}));
};
