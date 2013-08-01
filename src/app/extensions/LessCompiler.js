/**
 * LESS compiler
 */

'use strict';

var fs          = require('fs'),
    path        = require('path'),
    FileManager = global.getFileManager(),
    Compiler    = require(FileManager.appScriptsDir + '/Compiler'),
    fileWatcher = require(FileManager.appScriptsDir + '/fileWatcher.js');

function LessCompiler(config) {
    Compiler.apply(this, arguments);
}
require('util').inherits(LessCompiler, Compiler);
module.exports = LessCompiler;

LessCompiler.prototype.compileFile = function (file, done) {
    // compile file with command
    var globalSettings = this.getGlobalSettings();
    if (globalSettings.advanced.useCommand) {
        this.compileFileWithCommand(file, done);
    } else {
        this.compileFileWithLib(file, function (lessErr) {
            done(prepareLessError(lessErr));
        });
    }
};

/**
 * compile file with node lib
 * @param  {Object} file file object to compiler
 * @param  {Object} done done callback
 */
LessCompiler.prototype.compileFileWithLib = function (file, done) {
    var self     = this,
        less     = require('less'),

        filePath = file.src,
        output   = file.output,
        settings = file.settings || {},

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
            strictMath: true,
            strictUnits: true
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
    if (/compress|yuicompress/.test(settings.outputStyle)) {
        options[settings.outputStyle] = true;
    }

    // strictMath and strictUnits
    options.strictMath = settings.strictMath;
    options.strictUnits = settings.strictUnits;
    
    var saveCss = function (css) {
        // remove local file path prefix
        if (settings.lineComments || settings.debugInfo) {
            var rootDir = options.paths[0] + path.sep;
                rootDir = rootDir.replace(/\\/g, '\\\\');
            css = css.replace(new RegExp(rootDir, 'g'), '');
        }

        //write css code into output
        fs.writeFile(output, css, 'utf8', function (wErr) {
            if (wErr) {
                done(wErr);
            } else {
                done();

                //add watch import file
                var imports = self.getImports(filePath);
                fileWatcher.addImports(imports, filePath);
            }
        });
    }
    
    //read code content
    fs.readFile(filePath, 'utf8', function (rErr, code) {
        if (rErr) {
            done(rErr);
            return false;
        }

        var parser = new(less.Parser)(options);
        parser.parse(code, function (parseErr, tree) {
            if (parseErr) {
                done(parseErr);
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
                    strictUnits: options.strictUnits
                });
                saveCss(css);
            } catch (e) {
                done(e);
            }
        });

    });
};

LessCompiler.prototype.compileFileWithCommand = function (file, done) {
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
            return /--compress|--yui-compress|--include-path/.test(item) === false;
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
        paths = paths.join(path.delimiter);
        argv.push('--include-path=' + paths);
    }

    //--compress, --yui-compress
    if (settings.outputStyle === 'compress') {
        argv.push('--compress');
    }
    if (settings.outputStyle === 'yuicompress') {
        argv.push('--yui-compress');
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

    exec([lesscPath].concat(argv).join(' '), {timeout: 5000}, function (error, stdout, stderr) {
        if (error !== null) {
            done(error);
        } else {
            done();

            //add watch import file
            var imports = self.getImports(filePath);
            fileWatcher.addImports(imports, filePath);
        }
    });
};

LessCompiler.prototype.getImports = function (srcFile) {
    //match imports from code
    var reg = /@import\s+[\"\']([^\.]+?|.+?less)[\"\']/g,
        result, item, file,

        //get fullpath of imports
        dirname = path.dirname(srcFile),
        extname = path.extname(srcFile),
        fullPathImports = [],

        code = fs.readFileSync(srcFile, 'utf8');
        code = code.replace(/\/\/.+?[\r\t\n]/g, '').replace(/\/\*[\s\S]+?\*\//g, '');

    while ((result = reg.exec(code)) !== null ) {
        item = result[1];
        if (path.extname(item) !== extname) {
            item += extname;
        }

        file = path.resolve(dirname, item);

        if (fs.existsSync(file)) {
            fullPathImports.push(file);
        }
    }

    return fullPathImports;
};

function prepareLessError(err) {
    if (err && err.extract) {
        var extract = err.extract,
            error = [],
            message = "";

        if (typeof(extract[0]) === 'string') {
            error.push((err.line - 1) + ' ' + extract[0]);
        }
        if (extract[1]) {
            error.push(err.line + ' ' + extract[1]);
        }
        if (typeof(extract[2]) === 'string') {
            error.push((err.line + 1) + ' ' + extract[2]);
        }

        err.message = err.type + 'Error: ' + err.message;

        if (err.filename) {
            err.message += ' in ' + err.filename + ':' + err.line + ':' + err.column + '\n';
        }

        err.message += error.join('\n');
    }

    return err;
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
