/**
 * Dust compiler
 */

'use strict';

var fs          = require('fs'),
    path        = require('path'),
    FileManager = global.getFileManager(),
    Compiler    = require(FileManager.appScriptsDir + '/Compiler');

function DustCompiler(config) {
    Compiler.call(this, config);
}
require('util').inherits(DustCompiler, Compiler);
module.exports = DustCompiler;

Compiler.prototype.compileFile = function (file, useSystemCommand, done) {
    if (useSystemCommand.dustc) {
        this.compileFileWithSystemCommand(file, done);
    } else {
        this.compileFileWithLib(file, done);
    }
};

DustCompiler.prototype.compileSource = function (sourceCode, sourceName, options, done) {
    var dust = require('dustjs-linkedin');
    done(null, dust.compile(sourceCode, sourceName));
};

DustCompiler.prototype.compileBySystemCommand = function (file, done) {
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

    exec('dustc ' + argv.join(' '), {cwd: path.dirname(filePath), timeout: 5000}, done);
};
