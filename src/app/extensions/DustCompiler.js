/**
 * Dust compiler
 */

'use strict';

var fs          = require('fs'),
    path        = require('path'),
    FileManager = global.getFileManager(),
    notifier    = require(FileManager.appScriptsDir + '/notifier.js'),
    Compiler    = require(FileManager.appScriptsDir + '/Compiler');

/**
 * Dust Compiler
 * @param {object} config The Current Compiler config
 */
function DustCompiler(config) {
   Compiler.call(this, config);
}
require('util').inherits(DustCompiler, Compiler);

module.exports = DustCompiler;

/**
 * compile dust file
 * @param  {Object} file      compile file object
 * @param  {Object} emitter  compile event emitter
 */
DustCompiler.prototype.compile = function (file, emitter) {
    //compile file by use system command
    var globalSettings = this.getGlobalSettings();
    if (globalSettings.advanced.useCommand) {
        this.compileWithCommand(file, emitter);
    } else {
        this.compileWithLib(file, emitter);
    }
}

/**
 * compile dust file with node lib
 * @param  {Object} file      compile file object
 * @param  {Object} handlers  compile event handlers
 */
DustCompiler.prototype.compileWithLib = function (file, emitter) {
    var dust = require('dustjs-linkedin'),
        filePath = file.src,
        output = file.output,
        settings = file.settings || {};

    var triggerError = function (message) {
        emitter.emit('fail');
        emitter.emit('always');

        notifier.throwError(message, filePath);
    }

    //read code content
    fs.readFile(filePath, 'utf8', function (rErr, code) {
        if (rErr) {
           triggerError(rErr.message);
           return false;
        }

        var jst;
        try {
            jst = dust.compile(code, path.basename(filePath, '.dust'));
        } catch (e) {
            triggerError(e.message);
            return false;
        }

        //write jst code into output
        fs.writeFile(output, jst, 'utf8', function (wErr) {
            if (wErr) {
                triggerError(wErr.message);
            } else {
                emitter.emit('done');
                emitter.emit('always');
            }
        });
    });
};

/**
 * compile file with system command
 * @param  {Object}   file    compile file object
 * @param  {Object}   emitter  compile event emitter
 */
DustCompiler.prototype.compileWithCommand = function (file, emitter) {
    var exec         = require('child_process').exec,
        filePath     = file.src,
        output       = file.output,
        compressOpts = {},

        argv = [
        '-n="' + path.basename(filePath, '.dust') + '"',
        '"' + filePath + '"',
        '"' + output + '"'
        ];

    var globalSettings  = this.getGlobalSettings(),
        dustcPath = globalSettings.advanced.commandPath || 'dustc';

    if (dustcPath.match(/ /)) {
        dustcPath = '"'+ dustcPath +'"';
    }

    global.debug(dustcPath);
    exec([dustcPath].concat(argv).join(' '), {cwd: path.dirname(filePath), timeout: 5000}, function (error, stdout, stderr) {
        if (error !== null) {
            emitter.emit('fail');
            notifier.throwError(stderr, filePath);
        } else {
            emitter.emit('done');
        }

        // do always handler
        emitter.emit('always');
    });
};
