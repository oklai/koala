/**
 * CoffeeScriptCompiler module
 */

'use strict';

var fs          = require('fs-extra'),
    path        = require('path'),
    util        = require('../util.js'),
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
        javascript, sourceMapObject;
    
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
            // javascript = coffee.compile(code, {
            //     bare: options.bare,
            //     literate: options.literate
            // });

            var task = {
                input: code,
                options: {
                    bare: options.bare,
                    literate: options.literate,
                    sourceMap: !!options.sourceMap
                }
            };

            var compiled = coffee.compile(task.input, task.options);
            
            javascript = compiled;

            if (task.options.sourceMap) {
                javascript = compiled.js + '\n//# sourceMappingURL=' + path.basename(output, '.js') + '.map';
                sourceMapObject = compiled.v3SourceMap;
            }
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

        // write sourcemap
        if (options.sourceMap) {
            var map, sourceRoot;
            try {
                map = JSON.parse(sourceMapObject);
                
                map.file = path.basename(output);
                
                sourceRoot = path.dirname(filePath);
                map.sources = [path.relative(sourceRoot, filePath)];
                map.sourceRoot = path.relative(path.dirname(output), sourceRoot);

                var mapOutput = path.join(path.dirname(output), path.basename(output, '.js') + '.map');
                fs.writeFileSync(mapOutput, JSON.stringify(map, null, '\t'));
            } catch (e) {}
        }
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
        pcfg     = this.getProjectById(file.pid).config, //get project config
        argv     = [];

    //custom options
    var customOptions = pcfg.customOptions;
    if (Array.isArray(customOptions)) {
        argv = argv.concat(customOptions);
    }

    argv.push('--compile');

    if (options.sourceMap) {
        argv.push('--map');
    }

    if (options.bare) {
        argv.push('--bare');
    }

    if (options.literate) {
        argv.push('--literate');
    }

    //argv.push('"' + filePath.replace(/\\/g, '/') + '"');
    argv.push(path.basename(filePath));

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

    var execOpts = {
        timeout: 5000,
        cwd: path.dirname(filePath)
    };
    
    // fix #129 env: node: No such file or directory
    if (process.platform === 'darwin') {
        execOpts.env = {
            PATH: "/usr/bin:/bin:/usr/sbin:/sbin:/usr/local/bin/"
        }
    }
    
    exec([coffeePath].concat(argv).join(' '), execOpts, function (error, stdout, stderr) {
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

        // source map
        if (options.sourceMap) {
            var sourceMap = path.basename(filePath, '.coffee') + '.map',
                sourceMapFullPathOfSrc = path.join(path.dirname(filePath), sourceMap),
                sourceMapFullPathDest = path.join(path.dirname(output), sourceMap);

            fs.rename(sourceMapFullPathOfSrc, sourceMapFullPathDest, function () {
                var sourceMapObj = util.readJsonSync(sourceMapFullPathDest);
            
                if (typeof(sourceMapObj) === 'object' && sourceMapObj.hasOwnProperty('sourceRoot')) {
                    sourceMapObj.sourceRoot = path.relative(path.dirname(sourceMapFullPathDest), path.dirname(sourceMapFullPathOfSrc));
                }

                fs.outputFile(sourceMapFullPathDest, JSON.stringify(sourceMapObj, null, '\t')); 
            });
        }
    }
};