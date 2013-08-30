/**
 * Sass compiler
 */

'use strict';

var fs          = require('fs'),
    path        = require('path'),
    FileManager = global.getFileManager(),
    Compiler    = require(FileManager.appScriptsDir + '/Compiler.js'),
    util        = require(FileManager.appScriptsDir + '/util.js');
/**
 * Sass Compiler
 * @param {object} config The Current Compiler config
 */
function SassCompiler(config) {
   Compiler.call(this, config);
}
require('util').inherits(SassCompiler, Compiler);

module.exports = SassCompiler;

/**
 * compile sass & scss file
 * @param  {Object} file    compile file object
 * @param  {Object} emitter  compile event emitter
 */
SassCompiler.prototype.compile = function (file, emitter) {
    if (file.settings.compass) {
        this.compassCompile(file, emitter);
    } else {
        this.sassCompile(file, emitter);
    }
}

/**
 * Get Ruby Executable File Path
 * @return {[type]} [description]
 */
SassCompiler.prototype.getRubyPath = function () {
    var appConfig = this.getAppConfig(),
        rubyPath;

    if (appConfig.useCustomRuby) {
        rubyPath = appConfig.rubyCommandPath || 'ruby';
    } else {
        rubyPath = FileManager.rubyExecPath;
    }

    if (rubyPath.match(/ /)) {
        rubyPath = '"' + rubyPath + '"';
    }

    return rubyPath;
}

/**
 * get sass command
 * @return {String}
 */
SassCompiler.prototype.getSassCmd = function () {
    var globalSettings = this.getGlobalSettings(),
        command;

    if (globalSettings.advanced.useSassCommand) {
        // retrun Sass executable file
        command = globalSettings.advanced.sassCommandPath || 'sass';
        if (command.match(/ /)) {
            command = '"' + command + '"';
        }
    } else {
        command = [];
        command.push(this.getRubyPath());
        command.push('-S');
        command.push('"' + path.join(FileManager.appBinDir, 'sass') + '"');
        command = command.join(' ');
    }

    return command;
}

/**
 * sass compiler
 * @param  {Object} file    compile file object
 * @param  {Object} emitter  compile event emitter
 */
SassCompiler.prototype.sassCompile = function (file, emitter) {
    var self     = this,
        exec     = require('child_process').exec,
        filePath = file.src,
        output   = file.output,
        settings = file.settings;

    //run sass compile command
    var argv = ['"'+filePath+'"', '"'+output+'"', '--load-path', '"' + path.dirname(filePath) + '"'];

    //apply project config
    var pcfg = self.getProjectById(file.pid).config || {};

    //custom options
    var customOptions = pcfg.customOptions;
    if (Array.isArray(customOptions)) {
        customOptions = customOptions.filter(function (item) {
            return /--style|--line-comments|--debug-info|--unix-newlines/.test(item) === false;
        });
        argv = argv.concat(customOptions);
    }

    //include paths
    var includePaths = this.getAppConfig().includePaths;
    if (Array.isArray(pcfg.includePaths)) {
        includePaths = includePaths.concat(pcfg.includePaths);
    }
    includePaths.forEach(function (item) {
        argv.push('--load-path "' + item + '"');
    });

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
            emitter.emit('fail');
            self.throwError(stderr, filePath);
        } else {
            emitter.emit('done');
            //add watch import file
            var imports = util.getStyleImports('sass', filePath);
            self.watchImports(imports, filePath);
        }
            
        // do awayls
        emitter.emit('always');
    });
};

/**
 * get compass command
 * @return {String}
 */
SassCompiler.prototype.getCompassCmd = function (flag) {
    var compassSettings = this.getGlobalSettings('compass'),
        command;

    if (flag || compassSettings.advanced.useCompassCommand) {
        command = compassSettings.advanced.compassCommandPath || 'compass';
        if (command.match(/ /)) {
            command = '"' + command + '"';
        }
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
 * @param  {Object} emitter  compile event emitter
 */
SassCompiler.prototype.compassCompile = function (file, emitter) {
    var self             = this,
        exec             = require('child_process').exec,
        projectDb        = this.getProjectById(file.pid),
        projectConfig    = projectDb.config || {},
        projectDir       = projectDb.src,
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
            emitter.emit('fail');
            self.throwError(stdout || stderr, filePath);
        } else {
            emitter.emit('done');
            //add watch import file
            var imports = util.getStyleImports('sass', filePath);
            self.watchImports(imports, filePath);
        }

        // do awayls
        emitter.emit('always');
    });
};