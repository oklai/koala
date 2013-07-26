/**
 * Dust compiler
 */

'use strict';

var fs          = require('fs'),
    path        = require('path'),
    FileManager = global.getFileManager(),
    notifier    = require(FileManager.appScriptsDir + '/notifier.js'),
    appConfig   = require(FileManager.appScriptsDir + '/appConfigManager.js').getAppConfig();

/**
 * Dust Compiler
 * @param {object} settings The Current Compiler Settings
 */
function DustCompiler(settings) {
    DustCompiler.prototype.settings = settings;
}

module.exports = DustCompiler;

/**
 * compile dust file
 * @param  {Object} file      compile file object
 * @param  {Object} handlers  compile event handlers
 */
DustCompiler.prototype.compile = function (file, handlers) {
    handlers = handlers || {};

    //compile file by use system command
    if (this.settings.advanced.useCommand) {
        this.compileWithCommand(file, handlers);
    } else {
        this.compileWithLib(file, handlers);
    }
}

/**
 * compile dust file with node lib
 * @param  {Object} file      compile file object
 * @param  {Object} handlers  compile event handlers
 */
DustCompiler.prototype.compileWithLib = function (file, handlers) {
    var dust = require('dustjs-linkedin'),
        filePath = file.src,
        output = file.output,
        settings = file.settings || {};

    var triggerError = function (message) {
        if (handlers.fail) handlers.fail();
        if (handlers.always) handlers.always();

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
                if (handlers.done) handlers.done();
                if (handlers.always) handlers.always();
            }
        });
    });
};

/**
 * compile file with system command
 * @param  {Object}   file    compile file object
 * @param  {Object}   handlers  compile event handlers
 */
DustCompiler.prototype.compileWithCommand = function (file, handlers) {
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

    var dustcPath = this.settings.advanced.commandPath || 'dustc';
    if (dustcPath.match(/ /)) {
        dustcPath = '"'+ dustcPath +'"';
    }

    exec([dustcPath].concat(argv).join(' '), {cwd: path.dirname(filePath), timeout: 5000}, function (error, stdout, stderr) {
        if (error !== null) {
            if (handlers.fail) handlers.fail();
            notifier.throwError(stderr, filePath);
        } else {
            if (handlers.done) handlers.done();
        }

        // do always handler
        if (handlers.always) handlers.always();
    });
};
