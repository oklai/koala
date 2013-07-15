/**
 * Compass compiler
 */

'use strict';

var fs          = require('fs'),
    path        = require('path'),
    exec        = require('child_process').exec,
    FileManager = global.getFileManager(),
    Compiler    = require(FileManager.appScriptsDir + '/Compiler'),
    projectDb   = require(FileManager.appScriptsDir + '/storage.js').getProjects(),
    notifier    = require(FileManager.appScriptsDir + '/notifier.js'),
    appConfig   = require(FileManager.appScriptsDir + '/appConfig.js').getAppConfig(),
    fileWatcher = require(FileManager.appScriptsDir + '/fileWatcher.js');

function CompassCompiler(config) {
    Compiler.call(this, config);
}
require('util').inherits(CompassCompiler, Compiler);
module.exports = CompassCompiler;

/**
 * get sass command
 * @return {String}
 */
CompassCompiler.prototype.getCompassCmd = function (flag) {
    if (flag || appConfig.useSystemCommand.compass) {
        return 'compass';
    }

    if (this.compassCmd) return this.compassCmd;

    var compass = '"' + path.join(__dirname, 'bin', 'compass') + '"',
        command = [];

    command.push('"' + FileManager.rubyExecPath + '" -S');
    command.push(compass);
    command = command.join(' ');
    this.compassCmd = command;
    return command;
};

/**
 * compile sass & scss file
 * @param  {Object} file    compile file object
 * @param  {Function} success compile success calback
 * @param  {Function} fail    compile fail callback
 */
CompassCompiler.prototype.compile = function (file, success, fail) {
    var self = this,
        projectConfig = projectDb[file.pid].config || {},
        projectDir = projectDb[file.pid].src,
        filePath = file.src,
        relativeFilePath = path.relative(projectDir, filePath),
        settings = file.settings;

    var argv = [
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
            if (fail) fail();
            notifier.throwError(stderr || stdout, filePath);
        } else {
            if (success) success();

            //add watch import file
            var imports = self.getImports(filePath);
            fileWatcher.addImports(imports, filePath);
        }
    });
};

CompassCompiler.prototype.getImports = function (srcFile) {
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
