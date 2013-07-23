/**
 * file types manager module
 */

'use strict';

exports.fileTypes = {};
exports.extensions = [];

exports.addFileTypeWithConfig = function (fileTypeConfig, dir) {
    if (!fileTypeConfig) {
        return null;
    }
    
    var FileType = require('./FileType'),
        fileType;

    fileType = new FileType(fileTypeConfig, dir);
    exports.fileTypes[fileType.name] = fileType;
    exports.extensions = exports.extensions.concat(fileType.extensions);

    return fileType;
};

/**
 * Get File Types
 * @return {object} file types
 */
exports.getFileTypes = function () {
    return exports.fileTypes;
};

/**
 * Get File Types As A Array
 * @return {array} file types
 */
exports.getFileTypesAsArray = function () {
    return Object.keys(exports.fileTypes).map(function (fileTypeName) {
        return this[fileTypeName];
    }, exports.fileTypes);
};

/**
 * Get FileType for the given extension, or null if not found.
 * @param  {String} ext  A file extension.
 * @return {Object}      FileType for "ext", or null.
 */
exports.fileTypeForExtension = function (ext) {
    for (var fileTypeName in exports.fileTypes) {
        if (exports.fileTypes.hasOwnProperty(fileTypeName) && exports.fileTypes[fileTypeName].hasExtension(ext)) {
            return exports.fileTypes[fileTypeName];
        }
    }
    return null;
};

/**
 * Get Extensions
 * @return {array} extensions
 */
exports.getExtensions = function () {
    return exports.extensions;
};
