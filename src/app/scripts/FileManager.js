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
 * copy file sync
 * @param {String} srcFile  src file path
 * @param {String} destFile dest file path
 */
exports.copyFileSync = function (srcFile, destFile, callback) {
    var BUF_LENGTH, buff, bytesRead, fdr, fdw, pos;

    BUF_LENGTH = 64 * 1024;
    buff = new Buffer(BUF_LENGTH);
    fdr = fs.openSync(srcFile, 'r');
    fdw = fs.openSync(destFile, 'w');
    bytesRead = 1;
    pos = 0;

    while (bytesRead > 0) {
        bytesRead = fs.readSync(fdr, buff, 0, BUF_LENGTH, pos);
        fs.writeSync(fdw, buff, 0, bytesRead);
        pos += bytesRead;
    }

    fs.closeSync(fdr);
    return fs.closeSync(fdw);
};


/**
 * is file in some directory
 * @param  {String} fileName file name
 * @param  {String} dir      dir path
 * @return {Boolean}
 */
exports.inDirectory = function (fileName, targetDir) {
    if (!fs.existsSync(targetDir)) {
        return;
    }

    var result;

    function wark(dir) {
        var dirList = fs.readdirSync(dir);

        for (var i = 0; i < dirList.length; i++) {
            var item = dirList[i];

            //filter system file
            if (/^\./.test(item)) {
                continue;
            }

            if (fs.statSync(path.join(dir, item)).isDirectory()) {
                wark(path.join(dir, item));
            } else {
                if (item === fileName) {
                    result = path.join(dir, item);
                    break;
                }
            }
        }
    }
    wark(targetDir);

    return result;
};

/**
 * recursively mkdir
 * @param {String}   p    dir path
 * @param {Number}   mode mode
 * @param {Function} f    callback
 * @param {object}   made
 */
exports.mkdirP = function (p, mode, f, made) {
    if (typeof mode === 'function' || mode === undefined) {
        f = mode;
        mode = '0777';
    }
    if (!made) made = null;

    var cb = f || function () {};
    if (typeof mode === 'string') mode = parseInt(mode, 8);
    p = path.resolve(p);

    fs.mkdir(p, mode, function (er) {
        if (!er) {
            made = made || p;
            return cb(null, made);
        }
        switch (er.code) {
            case 'ENOENT':
                exports.mkdirP(path.dirname(p), mode, function (er, made) {
                    if (er) cb(er, made);
                    else exports.mkdirP(p, mode, cb, made);
                });
                break;

            // In the case of any other error, just see if there's a dir
            // there already.  If so, then hooray!  If not, then something
            // is borked.
            default:
                fs.stat(p, function (er2, stat) {
                    // if the stat fails, then that's super weird.
                    // let the original error be the failure reason.
                    if (er2 || !stat.isDirectory()) cb(er, made)
                    else cb(null, made);
                });
                break;
        }
    });
};

/**
 * recursively mkdir sync
 * @param {String} p    dir path
 * @param {Number} mode mode
 * @param {object} made
 */
exports.mkdirPSync = function (p, mode, made) {
    if (mode === undefined) {
        mode = '0777';
    }
    if (!made) made = null;

    if (typeof mode === 'string') mode = parseInt(mode, 8);
    p = path.resolve(p);

    try {
        fs.mkdirSync(p, mode);
        made = made || p;
    }
    catch (err0) {
        switch (err0.code) {
            case 'ENOENT' :
                made = exports.mkdirPSync(path.dirname(p), mode, made);
                exports.mkdirPSync(p, mode, made);
                break;

            // In the case of any other error, just see if there's a dir
            // there already.  If so, then hooray!  If not, then something
            // is borked.
            default:
                var stat;
                try {
                    stat = fs.statSync(p);
                }
                catch (err1) {
                    throw err0;
                }
                if (!stat.isDirectory()) throw err0;
                break;
        }
    }

    return made;
};

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
