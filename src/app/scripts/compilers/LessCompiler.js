/**
 * LESS compiler
 */

'use strict';

var fs          = require('fs'),
    path        = require('path'),
    FileManager = global.getFileManager(),
    Compiler    = require(FileManager.appScriptsDir + '/Compiler.js'),
    common      = require('./common.js');

/**
 * LESS Compiler
 * @param {object} config compiler config
 */
function LessCompiler(config) {
   Compiler.call(this, config);
}
require('util').inherits(LessCompiler, Compiler);

module.exports = LessCompiler;

/**
 * compile less file
 * @param  {Object} file    compile file object
 * @param  {Object} emitter  compile event emitter
 */
LessCompiler.prototype.compile = function (file, emitter) {
    //compile file by use system command
    var settings = this.getGlobalSettings();
    if (settings.advanced.useCommand) {
        this.compileWithCommand(file, emitter);
    } else {
        this.compileWithLib(file, emitter);
    }
}
/**
 * compile less file
 * @param  {Object} file    compile file object
 * @param  {Object} emitter  compile event emitter
 */
LessCompiler.prototype.compileWithLib = function (file, emitter) {
    var self       = this,
        less       = require('less'),

        filePath   = file.src,
        output     = file.output,
        settings   = file.settings || {},

        //project config
        pcfg = self.getProjectById(file.pid).config || {},
        appConfig = self.getAppConfig(),
        options = {
            filename: filePath,
            depends: false,
            compress: false,
            yuicompress: false,
            max_line_len: -1,
            optimization: 1,
            silent: false,
            verbose: false,
            lint: false,
            paths: [path.dirname(filePath)].concat(appConfig.includePaths),
            color: false,
            strictImports: false,
            rootpath: '',
            relativeUrls: false,
            ieCompat: true,
            strictMath: false,
            strictUnits: false,
            sourceMap: false,
            cleancss: false
        };

    //apply project config
    //custom options
    var match;
    if (Array.isArray(pcfg.customOptions)) {
        pcfg.customOptions.forEach(function (arg) {
            match = arg.match(/^--?([a-z][0-9a-z-]*)(?:=([^\s]*))?$/i);
            if (match) {
                arg = match[1];
            } else {
                return false;
            }

            switch (arg) {
                case 's':
                case 'silent':
                    options.silent = true;
                    break;
                case 'l':
                case 'lint':
                    options.lint = true;
                    break;
                case 'strict-imports':
                    options.strictImports = true;
                    break;
                case 'M':
                case 'depends':
                    options.depends = true;
                    break;
                case 'max-line-len':
                    if (match[2]) {
                        options.maxLineLen = parseInt(match[2], 10);
                        if (options.maxLineLen <= 0) {
                          options.maxLineLen = -1;
                        }
                    }
                    break;
                case 'no-ie-compat':
                    options.ieCompat = false;
                    break;
                case 'O0': options.optimization = 0; break;
                case 'O1': options.optimization = 1; break;
                case 'O2': options.optimization = 2; break;
                case 'rp':
                case 'rootpath':
                    if (match[2]) {
                        options.rootpath = match[2].replace(/\\/g, '/');
                    }
                    break;
                case "ru":
                case "relative-urls":
                    options.relativeUrls = true;
                    break;
            }
        });
    }

    //include paths
    if (Array.isArray(pcfg.includePaths)) {
        options.paths = options.paths.concat(pcfg.includePaths);
    }

    //dumpLineNumbers
    if (settings.lineComments) {
        options.dumpLineNumbers = "comments";
    }
    if (settings.debugInfo) {
        options.dumpLineNumbers = "mediaquery";
    }
    if (settings.lineComments && settings.debugInfo) {
        options.dumpLineNumbers = "all";
    }

    //compress options
    if (/compress/.test(settings.outputStyle)) {
        options[settings.outputStyle] = true;
    }

    // strictMath and strictUnits
    options.strictMath = settings.strictMath;
    options.strictUnits = settings.strictUnits;

    // source map
    options.sourceMap = settings.sourceMap;
    if (options.sourceMap === true) {
        options.sourceMap = path.basename(output) + '.map';
        options.sourceMapOutputFilename = path.basename(output);
        options.sourceMapBasepath = path.dirname(output);
        options.sourceMapFullFilename =  output + '.map';
    }
    var writeSourceMap = function (sourceMapOutput) {
        var filename =options.sourceMapFullFilename;
        sourceMapOutput = self.replaceSourcesPath({
            inputFilePath: filePath,
            outputFilePath: output,
            sourceMapOutput: sourceMapOutput
        });
        fs.writeFileSync(filename, sourceMapOutput, 'utf8');
    };

    var triggerError = function (error) {
        emitter.emit('fail');
        emitter.emit('always');
        self.throwError(parseError(error), filePath);
    }
    
    var saveCss = function (css) {
        // remove local file path prefix
        if (settings.lineComments || settings.debugInfo) {
            var rootDir = options.paths[0] + path.sep;
                rootDir = rootDir.replace(/\\/g, '\\\\');
            css = css.replace(new RegExp(rootDir, 'g'), '');
        }

        // auto add css prefix
        if (settings.autoprefix) {
            css = require('autoprefixer').process(css).css;
            if (settings.sourceMap) {
                css = css + '\n/*# sourceMappingURL=' + path.basename(output) + '.map */'
            }
        }

        //write css code into output
        fs.writeFile(output, css, 'utf8', function (wErr) {
            if (wErr) {
                triggerError(wErr);
            } else {
                emitter.emit('done');
                emitter.emit('always');

                //add watch import file
                common.watchImports('less', filePath);
            }
        });
    }
    
    //read code content
    fs.readFile(filePath, 'utf8', function (rErr, code) {
        if (rErr) {
            triggerError(rErr);
            return false;
        }

        var parser = new(less.Parser)(options);
        parser.parse(code, function (parseErr, tree) {
            if (parseErr) {
                triggerError(parseErr);
                return false;
            }

            var css;
            try {
                css = tree.toCSS({
                    silent: options.silent,
                    verbose: options.verbose,
                    ieCompat: options.ieCompat,
                    compress: options.compress,
                    yuicompress: options.yuicompress,
                    maxLineLen: options.maxLineLen,
                    strictMath: options.strictMath,
                    strictUnits: options.strictUnits,
                    sourceMap: Boolean(options.sourceMap),
                    sourceMapFilename: options.sourceMap,
                    sourceMapURL: options.sourceMapURL,
                    sourceMapOutputFilename: options.sourceMapOutputFilename,
                    sourceMapBasepath: options.sourceMapBasepath,
                    sourceMapRootpath: options.sourceMapRootpath || "",
                    outputSourceFiles: options.outputSourceFiles,
                    writeSourceMap: writeSourceMap
                });
                saveCss(css);
            } catch (e) {
                triggerError(e);
            }
        });

    });
};

/**
 * compile file by system command
 * @param  {Object} emitter  compile event emitter
 */
LessCompiler.prototype.compileWithCommand = function (file, emitter) {
    var self     = this,
        exec     = require('child_process').exec,
        filePath = file.src,
        output   = file.output,
        settings = file.settings || {},
        pcfg = this.getProjectById(file.pid).config, //get project config
        argv = [
        '"' + filePath + '"',
        '"' + output + '"'
        ];

    //custom options
    var customOptions = pcfg.customOptions;
    if (Array.isArray(customOptions)) {
        customOptions = customOptions.filter(function (item) {
            return /--compress|--include-path/.test(item) === false;
        });
        argv = argv.concat(customOptions);
    }

    // include paths
    // --include-path=PATHS. Set include paths. Separated by `:'. Use `;' on Windows
    var paths = self.getAppConfig().includePaths;
    if (Array.isArray(pcfg.includePaths) && pcfg.includePaths.length) { 
        paths = paths.concat(pcfg.includePaths);
    }
    if (paths.length) {
        paths = paths.map(function (item) {
            return '"' + item + '"';
        });
        paths = process.platform === 'win32' ? paths.join(';') : paths.join(':');
        argv.push('--include-path=' + paths);
    }

    // --source-map
    if (settings.sourceMap && !/--source-map/.test(customOptions)) {
        argv.push('--source-map');
    }

    //--compress, --yui-compress
    if (settings.outputStyle === 'compress') {
        argv.push('--compress');
    }

    //dumpLineNumbers
    var dumpLineNumbers;
    if (settings.lineComments) {
        dumpLineNumbers = "comments";
    }
    if (settings.debugInfo) {
        dumpLineNumbers = "mediaquery";
    }
    if (settings.lineComments && settings.debugInfo) {
        dumpLineNumbers = "all";
    }
    //--line-numbers=TYPE (comments, mediaquery, all)
    if (dumpLineNumbers) {
        argv.push('--line-numbers=' + dumpLineNumbers);
    }
    //--strict-math
    argv.push('--strict-math=' + (settings.strictMath ? 'on' : 'off'));
    //--strict-units
    argv.push('--strict-units=' + (settings.strictUnits ? 'on' : 'off'));

    argv.push('--no-color');

    // get lessc path
    var globalSettings = this.getGlobalSettings(),
        lesscPath = globalSettings.advanced.commandPath || 'lessc';

    if (lesscPath.match(/ /)) {
        lesscPath = '"'+ lesscPath +'"';
    }

        //==== for lessphp ====
    if (lesscPath.match(/plessc/)) {
        argv = [
        '"' + filePath + '"',
        '>',
        '"' + output + '"'
        ];

        if (settings.outputStyle === 'compress') {
            argv = [].concat('-f=compressed', argv);
        }
    }
    //==== /for lessphp ====
    
    var execOpts = {
        timeout: 5000
    };
    
    // fix #129 env: node: No such file or directory
    if (process.platform === 'darwin') {
        execOpts.env = {
            PATH: "/usr/bin:/bin:/usr/sbin:/sbin:/usr/local/bin/"
        }
    }

    var reWriteSourceMap = function () {
        var sourceMapPath = output + '.map';
        
        if (!fs.existsSync(sourceMapPath)) {
            return false;
        }

        var sourceMapOutput =fs.readFileSync(sourceMapPath ,'utf8');
        sourceMapOutput = self.replaceSourcesPath({
            inputFilePath: filePath,
            outputFilePath: output,
            sourceMapOutput: sourceMapOutput
        });

        fs.writeFileSync(sourceMapPath, sourceMapOutput, 'utf8');
    };

    exec([lesscPath].concat(argv).join(' '), execOpts, function (error, stdout, stderr) {
        if (error !== null) {
            emitter.emit('fail');
            self.throwError(stderr, filePath);
        } else {
            emitter.emit('done');

            //add watch import file
            common.watchImports('less', filePath);

            if (argv.indexOf('--source-map') > -1) {
                reWriteSourceMap();
            }

            // auto add css prefix
            if (settings.autoprefix) {
                common.autoprefix(file);
            }
        }
        // trigger always handler
        emitter.emit('always');
    });
};

/**
 * parse error of less
 * @param  {Object} ctx error object
 */
function parseError (ctx) {
    var message = "";

    if (ctx.extract) {
        var extract = ctx.extract;
        var error = [];

        if (typeof(extract[0]) === 'string') {
            error.push((ctx.line - 1) + ' ' + extract[0]);
        }
        if (extract[1]) {
            error.push(ctx.line + ' ' + extract[1]);
        }
        if (typeof(extract[2]) === 'string') {
            error.push((ctx.line + 1) + ' ' + extract[2]);
        }

        message += ctx.type + 'Error: ' + ctx.message;

        if (ctx.filename) {
            message += ' in ' + ctx.filename + ':' + ctx.line + ':' + ctx.column + '\n';
        }

        message += error.join('\n');

    } else {
        message = ctx.message;
    }

    return message;
}

/**
 * check boolean arg
 * @param  {String} arg
 * @return {Booleam}
 */
function checkBooleanArg (arg) {
    var onOff = /^((on|t|true|y|yes)|(off|f|false|n|no))$/i.exec(arg);

    if (!onOff) return false;

    return Boolean(onOff[2]);
}

/**
 * replace source map object sources path to relative
 * @param  {string} inputFilePath   input file path
 * @param  {string} outputFilePath  output file path
 * @param  {string} sourceMapOutput sourcemap file content
 * @return {string}                 result sourcemap content
 */
LessCompiler.prototype.replaceSourcesPath = function (options) {
    // inputFilePath, outputFilePath, sourceMapOutput
    try {
        var mapObj = JSON.parse(options.sourceMapOutput),
            sourceRoot = path.dirname(options.inputFilePath);
        
        mapObj.sources = mapObj.sources.map(function (item) {
            if (item.indexOf(':') > -1 || item.indexOf('/') === 0) {
                return path.relative(sourceRoot, item).replace(/\\/g, '/');    
            } else {
                return item;
            }
        });

        mapObj.sourceRoot = path.relative(path.dirname(options.outputFilePath), sourceRoot);
        mapObj.file = path.basename(mapObj.file);
        
        return JSON.stringify(mapObj);
    } catch (e) {
        return options.sourceMapOutput;
    }
}
