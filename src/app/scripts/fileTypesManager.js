/**
 * file types manager module
 */

'use strict';

var fs                   = require('fs'),
    path                 = require('path'),
    util                 = require('./util'),
    FileType             = require('./FileType'),
    FileManager          = global.getFileManager(),
    fileTypes            = {},
    extensions           = [];

exports.loadFileType = function (fileTypeConfigPath) {
    return exports.addFileTypeWithConfig(util.readJsonSync(fileTypeConfigPath), path.dirname(fileTypeConfigPath));
};

exports.addFileTypeWithConfig = function (fileTypeConfig) {
    var fileType;
    if (!fileTypeConfig) {
        return null;
    }

    fileType = new FileType(fileTypeConfig);
    fileTypes[fileType.name] = fileType;
    extensions = extensions.concat(fileType.extensions);

    return fileType;
};

/**
 * get file types
 * @return {Array} file types
 */
exports.getFileTypes = function () {
    return fileTypes;
};

/**
 * get all effective extensions
 * @return {Array} extensions
 */
exports.getAllExtensions = function () {
    return extensions;
};

/**
 * get file type for the given extension, or null if not found.
 * @param  {String} ext an extension.
 * @return {Object} file type for "ext", or null.
 */
exports.fileTypeForExtension = function (ext) {
    for (var k in fileTypes) {
        if (fileTypes[k].extensions.indexOf(ext) > -1) {
            return fileTypes[k];
        }
    }

    return null;
};

/**
 * get file type with the given name, or null if not found.
 * @param  {String} name of the file type.
 * @return {Object} file type named "name", or null.
 */
exports.fileTypeWithName = function (name) {
    return fileTypes[name] || null;
};
