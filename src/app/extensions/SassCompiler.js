/**
 * Sass compiler
 */

'use strict';

var fs          = require('fs'),
    path        = require('path'),
    FileManager = global.getFileManager(),
    Compiler    = require(FileManager.appScriptsDir + '/Compiler'),
    projectDb   = require(FileManager.appScriptsDir + '/storage.js').getProjects(),
    notifier    = require(FileManager.appScriptsDir + '/notifier.js'),
    appConfig   = require(FileManager.appScriptsDir + '/appConfigManager.js').getAppConfig(),
    fileWatcher = require(FileManager.appScriptsDir + '/fileWatcher.js');

function SassCompiler(config) {
    Compiler.apply(this, arguments);
}
require('util').inherits(SassCompiler, Compiler);
module.exports = SassCompiler;

SassCompiler.prototype.compileFile = function (file, done) {
    if (file.settings.compass) {
        this.compassCompileFile(file, done);
    } else {
        this.sassCompileFile(file, done);
    }
};

/**
 * Get Ruby Executable File Path
 * @return {[type]} [description]
 */
SassCompiler.prototype.getRubyPath = function () {
    var rubyPath;

    if (appConfig.useCustomRuby) {
        rubyPath = appConfig.rubyCommandPath || 'ruby';
    } else {
        rubyPath = FileManager.rubyExecPath;
    }

    rubyPath = '"' + rubyPath + '"';

    return rubyPath;
};

/**
 * get sass command
 * @return {String}
 */
SassCompiler.prototype.getSassCmd = function () {
    var command;

    if (this.advanced.useSassCommand) {
        // retrun Sass executable file
        command = '"' + (this.advanced.sassCommandPath || 'sass') + '"';
    } else {
        command = [];
        command.push(this.getRubyPath());
        command.push('-S');
        command.push('"' + path.join(FileManager.appBinDir, 'sass') + '"');
        command = command.join(' ');
    }

    return command;
};

/**
 * sass compiler
 * @param  {Object} file    compile file object
 * @param  {Object} handlers  compile event handlers
 */
SassCompiler.prototype.sassCompileFile = function (file, done) {
    var self     = this,
        exec     = require('child_process').exec,
        filePath = file.src,
        output   = file.output,
        settings = file.settings;

    //run sass compile command
    var argv = ['"'+filePath+'"', '"'+output+'"', '--load-path', '"' + path.dirname(filePath) + '"'];

    //apply project config
    var pcfg = projectDb[file.pid].config;

    //custom options
    var customOptions = pcfg.customOptions;
    if (Array.isArray(customOptions)) {
        customOptions = customOptions.filter(function (item) {
            return /--style|--line-comments|--debug-info|--unix-newlines/.test(item) === false;
        });
        argv = argv.concat(customOptions);
    }

    //include paths
    if (Array.isArray(pcfg.includePaths)) {
        pcfg.includePaths.forEach(function (item) {
            argv.push('--load-path "' + item + '"');
        });
    }

    //require libs
    if (Array.isArray(pcfg.requireLibs)) {
        pcfg.requireLibs.forEach(function (item) {
            argv.push('--require "' + item + '"');
        });
    }

    //apply file settings
    argv.push('--style ' + settings.outputStyle);
    if (settings.lineComments) {
        argv.push('--line-comments');
    }

    if (settings.debugInfo) {
        argv.push('--debug-info');
    }

    if (settings.unixNewlines) {
        argv.push('--unix-newlines');
    }

    // reset the sass cache location, because the default location is the app root dir.
    argv.push('--cache-location "' + path.join(FileManager.userCacheDir, '.sass-cache') + '"');

    var command = self.getSassCmd();
        command += ' ' + argv.join(' ');

    exec(command, {timeout: 5000}, function (error, stdout, stderr) {
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

/**
 * get compass command
 * @return {String}
 */
SassCompiler.prototype.getCompassCmd = function (flag) {
    var command;
    if (flag || this.advanced.useCompassCommand) {
        command = '"' + (this.advanced.compassCommandPath || 'compass') + '"';
    } else {
        //return ruby -S CompassBinPath
        command = [];
        command.push(this.getRubyPath());
        command.push('-S');
        command.push('"' + path.join(FileManager.appBinDir, 'compass') + '"');
        command = command.join(' ');
    }

    return command;
};

/**
 * compass compiler
 * @param  {Object} file    compile file object
 * @param  {Object} handlers  compile event handlers
 */
SassCompiler.prototype.compassCompileFile = function (file, done) {
    var self             = this,
        exec             = require('child_process').exec,
        projectConfig    = projectDb[file.pid].config || {},
        projectDir       = projectDb[file.pid].src,
        filePath         = file.src,
        relativeFilePath = path.relative(projectDir, filePath),
        settings         = file.settings,
        argv = [
            'compile', '"' + relativeFilePath + '"',
            '--output-style', settings.outputStyle,
        ];

    if (settings.lineComments === false) {
        argv.push('--no-line-comments');
    }

    if (settings.debugInfo) {
        argv.push('--debug-info');
    }

    var command = self.getCompassCmd(projectConfig.useSystemCommand) + ' ' + argv.join(' ');
    exec(command, {cwd: projectDir, timeout: 5000}, function (error, stdout, stderr) {
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

/**
 * Get Import Files
 * @param  {string} srcFile source file path
 * @return {array}         imports
 */
SassCompiler.prototype.getImports = function (srcFile) {
    //match imports from code
    var reg = /@import\s+[\"\']([^\.]+?|.+?sass|.+?scss)[\"\']/g,
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

        // the '_' is omittable sass imported file
        if (path.basename(item).indexOf('_') === -1) {
            file = path.resolve(path.dirname(file), '_' + path.basename(item));
        }

        if (fs.existsSync(file)) {
            fullPathImports.push(file);
        }
    }

    return fullPathImports;
};