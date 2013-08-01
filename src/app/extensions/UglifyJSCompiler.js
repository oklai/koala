/**
 * UglifyJS compiler
 */

'use strict';

var fs          = require('fs'),
    path        = require('path'),
    FileManager = global.getFileManager(),
    Compiler    = require(FileManager.appScriptsDir + '/Compiler');

function UglifyJSCompiler(config) {
    Compiler.apply(this, arguments);
}
require('util').inherits(UglifyJSCompiler, Compiler);
module.exports = UglifyJSCompiler;

UglifyJSCompiler.prototype.compileFile = function (file, done) {
    // compile file with command
    var globalSettings = this.getGlobalSettings();
    if (globalSettings.advanced.useCommand) {
        this.compileFileWithCommand(file, done);
    } else {
        this.compileFileWithLib(file, done);
    }
};

UglifyJSCompiler.prototype.compileSource = function (sourceCode, sourceName, options, done) {
    var UglifyJS = require('uglify-js');
    done(null, UglifyJS.minify(sourceCode, {fromString: true}).code);
};

/**
 * compile file with system command
 * @param  {Object} file file object to compiler
 * @param  {Object} done done callback
 */
UglifyJSCompiler.prototype.compileFileWithCommand = function (file, done) {
    var exec         = require('child_process').exec,
        filePath     = file.src,
        output       = file.output,
        compressOpts = {},

        argv = [
        '"' + filePath + '"',
        '-o "' + output + '"'
        ];

    exec([this.getCommandPath('uglifyjs')].concat(argv).join(' '), {timeout: 5000}, done);
};
