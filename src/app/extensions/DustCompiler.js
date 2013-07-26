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
    if (this.advanced.useCommand) {
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
        settings     = file.settings || {},
        compressOpts = {},

        argv = [
        '-n="' + path.basename(filePath, '.dust') + '"',
        '"' + filePath + '"',
        '"' + output + '"'
        ];

    var dustPath = '"' + (this.advanced.commandPath || 'dustc') + '"';
    exec([dustPath].concat(argv).join(' '), {cwd: path.dirname(filePath), timeout: 5000}, done);
};
