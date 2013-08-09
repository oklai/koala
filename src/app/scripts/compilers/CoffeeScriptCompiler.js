/**
 * CoffeeScriptCompiler module
 */

'use strict';

var fs          = require('fs'),
    path        = require('path'),
    FileManager = global.getFileManager(),
    Compiler    = require(FileManager.appScriptsDir + '/Compiler.js');

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
 * @param  {Object} emitter  compile event emitter
 */
CoffeeScriptCompiler.prototype.compile = function (file, emitter) {
    //compile file by system command\
    var globalSettings = this.getGlobalSettings();
    if (globalSettings.advanced.useCommand) {
        this.compileWithCommand(file, emitter);
    } else {
        this.compileWithLib(file, emitter);
    }
}

/**
 * compile file with node lib
 * @param  {Object} file    compile file object
 * @param  {Object} emitter  compile event emitter
 */
CoffeeScriptCompiler.prototype.compileWithLib = function (file, emitter) {
    var coffee = require('coffee-script'),
        self = this,
        filePath = file.src,
        output = file.output,
        options = file.settings,
        javascript;
    
    var triggerError = function (message) {
        emitter.emit('fail');
        emitter.emit('always');
        self.throwError(message, filePath);
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
                emitter.emit('done');
                emitter.emit('always');
            }
        });
    });
};

/**
 * compile file with system command
 * @param  {Object} emitter compile event emitter
 */
CoffeeScriptCompiler.prototype.compileWithCommand = function (file, emitter) {
    var exec     = require('child_process').exec,
        self     = this,
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
        emitter.emit('fail');
        emitter.emit('always');
        self.throwError(message, filePath);
    };

    var triggerSuccess = function () {
        emitter.emit('done');
        emitter.emit('always');
    }

    var globalSettings = this.getGlobalSettings(),
        coffeePath = globalSettings.advanced.commandPath || 'coffee';
        
    if (coffeePath.match(/ /)) {
        coffeePath = '"'+ coffeePath +'"';
    }
    
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
