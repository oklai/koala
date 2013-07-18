/**
 * compilers manager module
 */

'use strict';

var fs                   = require('fs-extra'),
    path                 = require('path'),
    util                 = require('./util'),
    Compiler             = require('./Compiler'),
    FileManager          = global.getFileManager(),
    builtInCompilerNames = [],
    compilers            = {};

/**
 * install the new version compiler pack
 * @param  {String} fileUrl
 */
function installNewVersion (fileUrl) {
    var $       = jQuery,
        il8n    = require('./il8n'),
        loading = $.koalaui.loading(il8n.__('Downloading the new compiler pack...'));
    util.downloadFile(fileUrl, FileManager.tmpDir(), function (filePath) {
        loading.hide();
        exports.install(filePath);
    }, function (err) {
        loading.hide();

        err = il8n.__('Compiler pack auto download failed, try download it manually.') + '<br>Error: ' + err;
        $.koalaui.alert(err, function () {
            global.gui.Shell.openExternal(fileUrl);
        });
    });
}

exports.install = function (pack) {
    var il8n    = require('./il8n'),
        $       = jQuery,
        loading = $.koalaui.loading(il8n.__('Installing the compiler pack...')),

        // reading archives
        AdmZip = require('adm-zip'),
        zip = new AdmZip(pack),
        zipEntries = zip.getEntries(),
        packageJson,
        packageContent,
        packageData;

    var entries = [];
    for (var i = 0; i < zipEntries.length; i++) {
        var zipEntry = zipEntries[i],
            entryName = zipEntry.entryName;

        if (entryName === 'package.json') {
            packageJson = true;
            packageContent = zipEntry.getData().toString('utf8');
            continue;
        }
        entries.push(entryName);
    }

    var showError = function (message) {
        loading.hide();
        message = il8n.__('Install the compiler pack failed:') + '<br>' + il8n.__(message);
        $.koalaui.alert(message);
    }

    if (!packageJson) {
        showError('Not found the package.json file.');
        return false;
    }

    // parse package content
    packageData = util.parseJSON(packageContent);

    if (!packageData || !packageData.name || !packageData.class_path ||
        !packageData.version || !packageData.compiler_version ||
        !packageData.fileTypes || !packageData.output_extensions)
    {
        showError('Package.json is not complete.');
        return false;
    }

    var compilerName = packageData.name,
        compilerClassPath = packageData.class_path,
        compilerClassExists = false;

    for (i = 0; i < entries.length; i++) {
        if (entries[i] === compilerClassPath + ".js") {
            compilerClassExists = true;
            break;
        }
    }

    if (!compilerClassExists) {
        showError('Compiler class missing!');
        return false;
    }

    // install the compiler pack
    var compilerDir = path.join(FileManager.userCompilersDir, compilerName);
    zip.extractAllTo(compilerDir, true);

    // load new compiler
    var compiler = exports.loadCompiler(path.join(compilerDir, "package.json"));

    loading.hide();
    $.koalaui.tooltip('success', il8n.__('Compiler pack is installed successfully.', compiler.getDisplay("name")));
};

/**
 * detect compiler pack update
 */
exports.detectUpdate = function () {
    var $       = jQuery,
        il8n    = require('./il8n'),
        compilersRepo = require('./appConfig').getAppPackage().maintainers.compilers_repositories;

    function getVersionNum(version) {
        var numList = version.split('.'),
            versionNum = 0,
            multiple = 100;

        for (var i = 0;i < 3; i++) {
            if (numList[i] !== undefined) {
                versionNum += numList[i] * multiple;
                multiple = multiple / 10;
            }
        }

        return versionNum;
    }

    Object.keys(compilers).forEach(function (compilerName) {
        // Not delect for built-in compilers packs
        if (builtInCompilerNames.indexOf(compilerName) > -1) return false;

        var compiler = compilers[compilerName], url;

        if (compiler.detectUpdate) {
            compiler.detectUpdate(installNewVersion);
        } else {
            url = compilersRepo + '?' + util.createRdStr();
            $.getJSON(url, function (data) {
                if (data[compilerName]) {
                    var curVersion = compiler.version,
                        newVersion = data[compilerName].version;

                    if (getVersionNum(newVersion) > getVersionNum(curVersion)) {
                       $.koalaui.confirm(il8n.__('compiler pack update notification', compiler.getDisplay("name")), function () {
                            installNewVersion(data[compilerName].download);
                       });
                    }
                }
            });
        }
    });
};

exports.loadBuiltInCompilers = function () {
    // load compilers from compilers.json
    var compilersConfig = util.readJsonSync(FileManager.compilersConfigFile);
    if (compilersConfig) {
        compilersConfig.forEach(function (config) {
            exports.addCompilerWithConfig(config)
        });
    }
};

exports.loadCompiler = function (compilerConfigPath) {
    return exports.addCompilerWithConfig(util.readJsonSync(compilerConfigPath), path.dirname(compilerConfigPath));
};

exports.loadCompilers = function () {
    exports.loadBuiltInCompilers();
    FileManager.getAllPackageJSONFiles(FileManager.userCompilersDir).forEach(exports.loadCompiler);
};

exports.addCompilerWithConfig = function (compilerConfig, dir) {
    var CompilerClass, compiler, isBuiltIn = false;
    if (!compilerConfig) {
        return null;
    }
    if (!dir) {
        dir = FileManager.appCompilersDir;
        isBuiltIn = true;
    }

    CompilerClass = require(path.join(dir, compilerConfig.class_path));
    compiler = new CompilerClass(compilerConfig);
    compilers[compiler.name] = compiler;
    if (isBuiltIn) {
        builtInCompilerNames.push(compiler.name);
    }

    return compiler;
};

/**
 * get compilers
 * @return {Object} compilers
 */
exports.getCompilers = function () {
    return compilers;
};

/**
 * get compiler for the given file type, or null if not found.
 * @param  {String} fileType file type name.
 * @return {Object} compiler for the fileType, or null.
 */
exports.compilerForFileType = function (fileType) {
    var compilerName;
    for (compilerName in compilers) {
        if (compilers[compilerName].fileTypeNames.indexOf(fileType) !== -1) {
            return compilers[compilerName];
        }
    }

    return null;
};

/**
 * get default config
 * @return {Object} default config
 */
exports.getDefaultConfig = function () {
    var config = {useSystemCommand: {} },
        compilerName,
        compiler;
    for (compilerName in compilers) {
        compiler = compilers[compilerName];

        if (util.isEmpty(compiler.defaults)) {
            return;
        }

        config[compiler.name] = {};
        if (compiler.defaults.options) {
            for (var key in compiler.defaults.options) {
                config[compiler.name][key] = compiler.defaults.options[key];
            }
        }
        if (compiler.defaults.outputStyle !== undefined) {
            config[compiler.name].outputStyle = compiler.defaults.outputStyle;
        }
        config.useSystemCommand[compiler.name] = !!compiler.defaults.useSystemCommand;
    }
    return config;
};

/**
 * run compile
 * @param  {Object} file    compile file object
 * @param  {Function} success compile success calback
 * @param  {Function} fail    compile fail callback
 */
exports.compileFile = function (file, success, fail) {
    var output_dir = path.dirname(file.output);

    //create output dir if it's not exists
    if (!fs.existsSync(output_dir)) {
        fs.mkdirpSync(output_dir);
    }

    if (compilers.compass.accepts(file.extension) && file.settings.compass) {
        compilers.compass.compile(file, success, fail);
    } else {
        exports.compilerForFileType(file.type).compile(file, success, fail);
    }
};
