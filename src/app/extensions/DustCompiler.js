/**
 * Dust compiler
 */

'use strict';

var fs          = require('fs'),
    path        = require('path'),
    FileManager = global.getFileManager(),
    notifier    = require(FileManager.appScriptsDir + '/notifier.js'),
    appConfig   = require(FileManager.appScriptsDir + '/appConfigManager.js').getAppConfig();

function DustCompiler() {
}
module.exports = new DustCompiler();

/**
 * compile dust file
 * @param  {Object}   file    compile file object
 * @param  {Function} success compile success calback
 * @param  {Function} fail    compile fail callback
 */
DustCompiler.prototype.compile = function (file, success, fail) {
    //compile file by use system command
    if (appConfig.useSystemCommand.dustc) {
        this.compileBySystemCommand(file, success, fail);
        return false;
    }

    var dust = require('dustjs-linkedin'),
        filePath = file.src,
        output = file.output,
        settings = file.settings || {};

    //read code content
    fs.readFile(filePath, 'utf8', function (rErr, code) {
        if (rErr) {
            if (fail) fail();
            notifier.throwError(rErr.message, filePath);
            return false;
        }

        try {
            var jst = dust.compile(code, path.basename(filePath, '.dust'));

            //write jst code into output
            fs.writeFile(output, jst, 'utf8', function (wErr) {
                if (wErr) {
                    notifier.throwError(wErr.message, filePath);
                } else {
                    if (success) success();
                }
            });
        } catch (e) {
            if (fail) fail();
            notifier.throwError(e.message, filePath);
        }
    });
};

/**
 * compile file by system command
 * @param  {Object}   file    compile file object
 * @param  {Function} success compile success calback
 * @param  {Function} fail    compile fail callback
 */
DustCompiler.prototype.compileBySystemCommand = function (file, success, fail) {
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

    exec('dustc ' + argv.join(' '), {cwd: path.dirname(filePath), timeout: 5000}, function (error, stdout, stderr) {
        if (error !== null) {
            if (fail) fail();
            notifier.throwError(stderr, filePath);
        } else {
            if (success) success();
        }
    });
};
