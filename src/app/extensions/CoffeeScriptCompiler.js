/**
 * CoffeeScriptCompiler module
 */

'use strict';

var fs          = require('fs'),
    path        = require('path'),
    FileManager = global.getFileManager(),
    notifier    = require(FileManager.appScriptsDir + '/notifier.js'),
    Compiler    = require(FileManager.appScriptsDir + '/Compiler.js');
    //appConfig   = require(FileManager.appScriptsDir + '/appConfigManager.js').getAppConfig();

/**
 * CoffeeScript Compiler
 * @param {object} settings The Current Compiler Settings
 */
function CoffeeScriptCompiler(config) {
   Compiler.call(this, config);
}
require('util').inherits(CoffeeScriptCompiler, Compiler);

module.exports = CoffeeScriptCompiler;

/**
 * compile coffee file
 * @param  {Object} file    compile file object
 * @param  {Object} hanlders  compile event handlers
 */
CoffeeScriptCompiler.prototype.compile = function (file, handlers) {
    handlers = handlers || {};

    //compile file by system command\
    var globalSettings = this.getGlobalSettings();
    if (globalSettings.advanced.useCommand) {
        this.compileWithCommand(file, handlers);
    } else {
        this.compileWithLib(file, handlers);
    }
}

/**
 * compile file with node lib
 * @param  {Object} file    compile file object
 * @param  {Object} hanlders  compile event handlers
 */
CoffeeScriptCompiler.prototype.compileWithLib = function (file, handlers) {
    var coffee = require('coffee-script'),
        filePath = file.src,
        output = file.output,
        options = file.settings,
        javascript;
    
    var triggerError = function (message) {
        if (handlers.fail) handlers.fail();
        if (handlers.always) handlers.always();

        notifier.throwError(message, filePath);
    }

    //read code
    fs.readFile(filePath, 'utf8', function (rErr, code) {
        if (rErr) {
            triggerError(rErr.message);
        }

        try {
            javascript = coffee.compile(code, {
                bare: options.bare,
                literate: options.literate
            });
        } catch (e) {
            triggerError(e.message);
            return false;
        }
        
        //write output
        fs.writeFile(output, javascript, 'utf8', function (wErr) {
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
 * @param  {Object} handlers compile event handlers
 */
CoffeeScriptCompiler.prototype.compileWithCommand = function (file, handlers) {
    var exec     = require('child_process').exec,
        filePath = file.src,
        output   = file.output,
        options  = file.settings,
        argv     = [];

    argv.push('--compile');

    if (options.bare) {
        argv.push('--bare');
    }

    if (options.literate) {
        argv.push('--literate');
    }

    argv.push('"' + filePath.replace(/\\/g, '/') + '"');

    var triggerError = function (message) {
        if (handlers.fail) handlers.fail();
        if (handlers.always) handlers.always();

        notifier.throwError(message, filePath);
    };

    var triggerSuccess = function () {
        if (handlers.done) handlers.done();
        if (handlers.always) handlers.always();
    }

    var globalSettings = this.getGlobalSettings(),
        coffeePath = globalSettings.advanced.commandPath || 'coffee';
        
    if (coffeePath.match(/ /)) {
        coffeePath = '"'+ coffeePath +'"';
    }
    
    global.debug(coffeePath)
    exec([coffeePath].concat(argv).join(' '), {timeout: 5000}, function (error, stdout, stderr) {
        if (error !== null) {
            triggerError(stderr);
        } else {
            //move the result js file to output path
            if (path.dirname(filePath) === path.dirname(output)) {
                if (path.basename(filePath, '.coffee') !== path.basename(output, '.js')) {
                    moveResutToOutput();
                } else {
                    triggerSuccess();
                }
            } else {
                moveResutToOutput();
            }
        }
    });

    //move file
    function moveResutToOutput() {
        var result = path.join(path.dirname(filePath), path.basename(filePath, '.coffee') + '.js');

        fs.rename(result, output, function (err) {
            if (err) {
                triggerError(err.message);
            } else {
                triggerSuccess();
            }
        });
    }
};
