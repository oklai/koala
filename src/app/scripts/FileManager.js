/**
 * FileManager module
 */

'use strict';

var fs   = require('fs'),
    path = require('path'),
    util = require('./util');

exports.rubyExecPath = process.platform === 'win32' ? path.join(path.dirname(process.execPath), 'ruby', 'bin', 'ruby') : 'ruby';

exports.appRootDir   = process.cwd();
    exports.appDataDir      = path.join(exports.appRootDir, 'app');
        exports.appAssetsDir        = path.join(exports.appDataDir, 'assets');
        exports.appBinDir           = path.join(exports.appDataDir, 'bin');
        exports.appCompilersDir     = path.join(exports.appDataDir, 'compilers');
            exports.compilersConfigFile = path.join(exports.appCompilersDir, 'compilers.json');
        exports.appFileTypesDir     = path.join(exports.appDataDir, 'fileTypes');
            exports.fileTypesConfigFile = path.join(exports.appFileTypesDir, 'fileTypes.json');
        exports.appLocalesDir       = path.join(exports.appDataDir, 'locales');
        exports.appScriptsDir       = path.join(exports.appDataDir, 'scripts');
        exports.appSettingsDir      = path.join(exports.appDataDir, 'settings');
        exports.appViewsDir         = path.join(exports.appDataDir, 'views');
    exports.packageJSONFile = path.join(exports.appRootDir, 'package.json');

exports.userDataDir  = path.join(process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'], '.koala');
    exports.userCompilersDir = path.join(exports.userDataDir, 'compilers');
    exports.userFileTypesDir = path.join(exports.userDataDir, 'fileTypes');
    exports.userLocalesDir   = path.join(exports.userDataDir, 'locales');
    exports.errorLogFile     = path.join(exports.userDataDir, 'error.log');
    exports.historyFile      = path.join(exports.userDataDir, 'history.json');
    exports.importsFile      = path.join(exports.userDataDir, 'imports.json');
    exports.projectsFile     = path.join(exports.userDataDir, 'projects.json');
    exports.settingsFile     = path.join(exports.userDataDir, 'settings.json');

/**
 * tmp dir of system
 * @return {String} tmp dir
 */
exports.tmpDir = function () {
    var systemTmpDir =
            process.env.TMPDIR ||
            process.env.TMP ||
            process.env.TEMP ||
            (process.platform === 'win32' ? 'c:\\windows\\temp' : '/tmp');

    return path.join(systemTmpDir, 'koala_temp_' + util.createRdStr());
};

/**
 * get whether the file is for the OS or not.
 * @param  {String}  file The file to test.
 * @return {boolean}      `true` if `file` is for the OS, `false` otherwise.
 */
exports.isOSFile = function (file) {
    // OS X
    if (/^\.(_|DS_Store$)/.test(path.basename(file))) {
        return true;
    }
    return false;
};

/**
 * get whether the directory is for the OS or not.
 * @param  {String}  dir The directory to test.
 * @return {boolean}     `true` if `dir` is for the OS, `false` otherwise.
 */
exports.isOSDir = function (dir) {
    // OS X
    if (/^\.(fseventsd|Spotlight-V100|TemporaryItems|Trashes)$/.test(path.basename(dir))) {
        return true;
    }
    return false;
};
