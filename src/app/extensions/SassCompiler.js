/**
 * Sass compiler
 */

'use strict';

var fs          = require('fs'),
    path        = require('path'),
    FileManager = global.getFileManager(),
    projectDb   = require(FileManager.appScriptsDir + '/storage.js').getProjects(),
    notifier    = require(FileManager.appScriptsDir + '/notifier.js'),
    appConfig   = require(FileManager.appScriptsDir + '/appConfigManager.js').getAppConfig(),
    fileWatcher = require(FileManager.appScriptsDir + '/fileWatcher.js');

/**
 * Sass Compiler
 * @param {object} settings The Current Compiler Settings
 */
function SassCompiler(settings) {
    SassCompiler.prototype.settings = settings;
}

module.exports = SassCompiler;

/**
 * compile sass & scss file
 * @param  {Object} file    compile file object
 * @param  {Object} handlers  compile event handlers
 */
SassCompiler.prototype.compile = function (file, handlers) {
    handlers = handlers || {};

    if (file.settings.compass) {
        this.compassCompile(file, handlers);
    } else {
        this.sassCompile(file, handlers);
    }
}

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
    var command;

    if (this.settings.advanced.useSassCommand) {
        // retrun Sass executable file
        command = this.settings.advanced.sassCommandPath || 'sass';
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
 * @param  {Object} handlers  compile event handlers
 */
SassCompiler.prototype.sassCompile = function (file, handlers) {
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
            if (handlers.fail) handlers.fail();
            notifier.throwError(stderr, filePath);
        } else {
            if (handlers.done) handlers.done();
            //add watch import file
            var imports = self.getImports(filePath);
            fileWatcher.addImports(imports, filePath);
        }
            
        // do awayls
        if (handlers.always) handlers.always();
    });
};

/**
 * get compass command
 * @return {String}
 */
SassCompiler.prototype.getCompassCmd = function (flag) {
    var command;
    if (flag || this.settings.advanced.useCompassCommand) {
        command = this.settings.advanced.compassCommandPath || 'compass';
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
 * @param  {Object} handlers  compile event handlers
 */
SassCompiler.prototype.compassCompile = function (file, handlers) {
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
            if (handlers.fail) handlers.fail();
            notifier.throwError(stdout || stderr, filePath);
        } else {
            if (handlers.done) handlers.done();

            //add watch import file
            var imports = self.getImports(filePath);
            fileWatcher.addImports(imports, filePath);
        }

        // do awayls
        if (handlers.always) handlers.always();
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