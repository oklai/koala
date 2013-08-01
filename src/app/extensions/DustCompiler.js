/**
 * Dust compiler
 */

'use strict';

var fs          = require('fs'),
    path        = require('path'),
    FileManager = global.getFileManager(),
    Compiler    = require(FileManager.appScriptsDir + '/Compiler');

function DustCompiler(config) {
    Compiler.apply(this, arguments);
}
require('util').inherits(DustCompiler, Compiler);
module.exports = DustCompiler;

DustCompiler.prototype.compileFile = function (file, done) {
    // compile file with command
    var globalSettings = this.getGlobalSettings();
    if (globalSettings.advanced.useCommand) {
        this.compileFileWithCommand(file, done);
    } else {
        this.compileFileWithLib(file, done);
    }
};

DustCompiler.prototype.compileSource = function (sourceCode, sourceName, options, done) {
    var dust = require('dustjs-linkedin');
    done(null, dust.compile(sourceCode, sourceName));
};

/**
 * compile file with system command
 * @param  {Object} file file object to compiler
 * @param  {Object} done done callback
 */
DustCompiler.prototype.compileFileWithCommand = function (file, done) {
    var exec         = require('child_process').exec,
        filePath     = file.src,
        output       = file.output,
        compressOpts = {},

        argv = [
        '-n="' + path.basename(filePath, '.dust') + '"',
        '"' + filePath + '"',
        '"' + output + '"'
        ];

    exec([this.getCommandPath('dustc')].concat(argv).join(' '), {cwd: path.dirname(filePath), timeout: 5000}, done);
};
