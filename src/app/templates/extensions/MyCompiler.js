/**
 * My compiler
 */

'use strict';

var fs          = require('fs'),
    path        = require('path'),
    FileManager = global.getFileManager(),
    Compiler    = require(FileManager.appScriptsDir + '/Compiler'),
    projectDb   = require(FileManager.appScriptsDir + '/storage.js').getProjects(),
    notifier    = require(FileManager.appScriptsDir + '/notifier.js'),
    appConfig   = require(FileManager.appScriptsDir + '/appConfig.js').getAppConfig(),
    fileWatcher = require(FileManager.appScriptsDir + '/fileWatcher.js');

function MyCompiler(config) {
    Compiler.call(this, config);
}
require('util').inherits(MyCompiler, Compiler);
module.exports = MyCompiler;

MyCompiler.prototype.compileSource = function (sourceCode, sourceName, options, done) {
    done(null, sourceCode);
};

MyCompiler.prototype.compileBySystemCommand = function (file, done) {
    done();
};


/**
 * Get the absolute paths of imports in a file.
 * @param  {String} srcFile The file to get imports from.
 * @return {Array}          Array of absolute paths for imports in `srcFile`.
 */
MyCompiler.prototype.getImports = function (srcFile) {
    return [];
};
