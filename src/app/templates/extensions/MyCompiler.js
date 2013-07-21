/**
 * My compiler
 */

'use strict';

var fs          = require('fs'),
    path        = require('path'),
    FileManager = global.getFileManager(),
    Compiler    = require(FileManager.appScriptsDir + '/Compiler');

function MyCompiler(config) {
    Compiler.call(this, config);
}
require('util').inherits(MyCompiler, Compiler);
module.exports = MyCompiler;

MyCompiler.prototype.compileSource = function (sourceCode, sourceName, options, done) {
    done(null, sourceCode);
};

MyCompiler.prototype.compileFileWithSystemCommand = function (file, done) {
    done();
};

MyCompiler.prototype.getImports = function (srcFile) {
    return [];
};
