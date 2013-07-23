/**
 * CoffeeScriptCompiler module
 */

'use strict';

var fs          = require('fs'),
    path        = require('path'),
    FileManager = global.getFileManager(),
    Compiler    = require(FileManager.appScriptsDir + '/Compiler');

function CoffeeScriptCompiler(config) {
    Compiler.call(this, config);
}
require('util').inherits(CoffeeScriptCompiler, Compiler);
module.exports = CoffeeScriptCompiler;

Compiler.prototype.compileFile = function (file, useSystemCommand, done) {
    if (useSystemCommand.coffee) {
        this.compileFileWithSystemCommand(file, done);
    } else {
        this.compileFileWithLib(file, done);
    }
};

CoffeeScriptCompiler.prototype.compileSource = function (sourceCode, sourceName, options, done) {
    var coffee = require('coffee-script');
    done(null, coffee.compile(sourceCode, {
        bare: options.bare,
        literate: options.literate
    }));
};

CoffeeScriptCompiler.prototype.compileFileWithSystemCommand = function (file, done) {
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

    exec('coffee ' + argv.join(' '), {timeout: 5000}, function (err, stdout, stderr) {
        if (err) {
            return done(err)
        }

        // move the result js file to output path
        if (path.dirname(filePath) === path.dirname(output)) {
            if (path.basename(filePath, '.coffee') !== path.basename(output, '.js')) {
                moveResutToOutput();
            } else {
                done();
            }
        } else {
            moveResutToOutput();
        }
    });

    //move file
    function moveResutToOutput() {
        var result = path.join(path.dirname(filePath), path.basename(filePath, '.coffee') + '.js');
        fs.rename(result, output, done);
    }
};
