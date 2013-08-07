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
        exports.appAssetsDir     = path.join(exports.appDataDir, 'assets');
        exports.appBinDir        = path.join(exports.appDataDir, 'bin');
        exports.appExtensionsDir = path.join(exports.appDataDir, 'extensions');
        exports.appLocalesDir    = path.join(exports.appDataDir, 'locales');
        exports.appScriptsDir    = path.join(exports.appDataDir, 'scripts');
        exports.appSettingsDir   = path.join(exports.appDataDir, 'settings');
        exports.appViewsDir      = path.join(exports.appDataDir, 'views');
    exports.packageJSONFile = path.join(exports.appRootDir, 'package.json');

exports.oldUserDataDir = path.join(process.env[(process.platform === 'win32') ? 'USERPROFILE' : 'HOME'], '.koala');
exports.userDataDir  = path.join(process.env[(process.platform === 'win32') ? 'USERPROFILE' : 'HOME'], (process.platform === 'darwin') ? 'Library/Application Support/Koala/UserData' :'.koala');
    exports.userExtensionsDir = path.join(exports.userDataDir, 'extensions');
    exports.userLocalesDir    = path.join(exports.userDataDir, 'locales');
    exports.userCacheDir      = path.join(exports.userDataDir, 'cache');
    exports.errorLogFile      = path.join(exports.userDataDir, 'error.log');
    exports.historyFile       = path.join(exports.userDataDir, 'history.json');
    exports.importsFile       = path.join(exports.userDataDir, 'imports.json');
    exports.projectsFile      = path.join(exports.userDataDir, 'projects.json');
    exports.settingsFile      = path.join(exports.userDataDir, 'settings.json');

// Create it if the directory is not exists
if (!fs.existsSync(exports.userDataDir)) {
    fs.mkdirSync(exports.userDataDir);
}
if (!fs.existsSync(exports.userExtensionsDir)) {
    fs.mkdirSync(exports.userExtensionsDir);
}
if (!fs.existsSync(exports.userLocalesDir)) {
    fs.mkdirSync(exports.userLocalesDir);
}
// Migration
if (exports.oldUserDataDir !== exports.userDataDir && fs.existsSync(exports.oldUserDataDir)) {
    fs.readdirSync(exports.oldUserDataDir).forEach(function (fileName) {
        fs.renameSync(path.join(exports.oldUserDataDir, fileName), path.join(exports.userDataDir, fileName));
    });
    fs.rmdirSync(exports.oldUserDataDir);
}

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
    // Win
    if (/^thumbs\.db$/i.test(path.basename(file))) {
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


exports.getAllPackageJSONFiles = function (dir, skipOSDirs) {
    var packageJSONs = [];

    skipOSDirs = skipOSDirs || true;

    function walk(root) {
        var dirList = fs.readdirSync(root);

        for (var i = 0; i < dirList.length; i++) {
            var item = dirList[i];

            if (fs.statSync(path.join(root, item)).isDirectory()) {
                // Skip OS directories
                if (!skipOSDirs || !exports.isOSDir(item)) {
                    try {
                        walk(path.join(root, item));
                    } catch (e) {}
                }
            } else if (item === "package.json") {
                packageJSONs.push(path.join(root, item));
            }
        }
    }

    walk(dir);

    return packageJSONs;
};
