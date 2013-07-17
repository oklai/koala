/**
 * file types manager module
 */

'use strict';

var fs                   = require('fs'),
    path                 = require('path'),
    util                 = require('./util'),
    FileType             = require('./FileType'),
    FileManager          = global.getFileManager(),
    builtInFileTypeNames = [],
    fileTypes            = {},
    extensions           = [];

function getUserFileTypesConfig() {
    var userFileTypesConfig = [];

    function walk(root) {
        var dirList = fs.readdirSync(root);

        for (var i = 0; i < dirList.length; i++) {
            var item = dirList[i];

            if (fs.statSync(path.join(root, item)).isDirectory()) {
                // Skip OS directories
                if (!FileManager.isOSDir(item)) {
                    try {
                        walk(path.join(root, item));
                    } catch (e) {}
                }
            } else if (item === "package.json") {
                userFileTypesConfig.push(path.join(root, item));
            }
        }
    }

    walk(FileManager.userFileTypesDir);

    return userFileTypesConfig;
}

function loadFileType(fileTypeConfigPath) {
    var fileTypeConfigString = fs.readFileSync(fileTypeConfigPath, 'utf8'),
        fileTypeConfig, fileType;

    fileTypeConfigString = util.replaceJsonComments(fileTypeConfigString);
    try {
        fileTypeConfig = JSON.parse(fileTypeConfigString);
        fileType = new FileType(fileTypeConfig);
        fileTypes[fileType.name] = fileType;
        extensions = extensions.concat(fileType.extensions);
        builtInFileTypeNames.push(fileType.name);
    } catch (e) {}

    return fileType;
}

/**
 * install the new version file type pack
 * @param  {String} fileUrl
 */
function installNewVersion (fileUrl) {
    var $       = jQuery,
        il8n    = require('./il8n'),
        loading = $.koalaui.loading(il8n.__('Downloading the new file type pack...'));
    util.downloadFile(fileUrl, FileManager.tmpDir(), function (filePath) {
        loading.hide();
        exports.install(filePath);
    }, function (err) {
        loading.hide();

        err = il8n.__('File type pack auto download failed, try download it manually.') + '<br>Error: ' + err;
        $.koalaui.alert(err, function () {
            global.gui.Shell.openExternal(fileUrl);
        });
    });
}

exports.install = function (pack) {
    var il8n    = require('./il8n'),
        $       = jQuery,
        loading = $.koalaui.loading(il8n.__('Installing the file type pack...')),

        // reading archives
        AdmZip = require('adm-zip'),
        zip = new AdmZip(pack),
        zipEntries = zip.getEntries(),
        packageJson,
        packageContent,
        packageData;

    for (var i = 0; i < zipEntries.length; i++) {
        var zipEntry = zipEntries[i],
            entryName = zipEntry.entryName;

        if (entryName === 'package.json') {
            packageJson = true;
            packageContent = zipEntry.getData().toString('utf8');
            continue;
        }
    }

    var showError = function (message) {
        loading.hide();
        message = il8n.__('Install the file type pack failed:') + '<br>' + il8n.__(message);
        $.koalaui.alert(message);
    }

    if (!packageJson) {
        showError('Not found the package.json file.');
        return false;
    }

    // parse package content
    packageContent = util.replaceJsonComments(packageContent);
    try {
        packageData = JSON.parse(packageContent);
    } catch (e) {
        packageData = {};
    }

    if (!packageData || !packageData.name || !packageData.version || !packageData.extensions) {
        showError('Package.json is not complete.');
        return false;
    }

    var fileTypeName = packageData.name;

    // install the file type pack
    var fileTypeDir = path.join(FileManager.userFileTypesDir, fileTypeName);
    zip.extractAllTo(fileTypeDir, true);

    // load new file type
    var fileType = loadFileType(path.join(fileTypeDir, "package.json"));

    loading.hide();
    $.koalaui.tooltip('success', il8n.__('File type pack is installed successfully.', fileType.getDisplay("name")));
};

exports.loadFileTypes = function () {
    // load file types from fileTypes.json
    var fileTypesConfigString = fs.readFileSync(FileManager.fileTypesConfigFile, 'utf8'),
        fileTypesConfig = {};

    fileTypesConfigString = util.replaceJsonComments(fileTypesConfigString);
    try {
        fileTypesConfig = JSON.parse(fileTypesConfigString);
    } catch (e) {}

    fileTypesConfig.forEach(function (fileTypeConfig) {
        var fileType = new FileType(fileTypeConfig);
        fileTypes[fileType.name] = fileType;
        extensions = extensions.concat(fileType.extensions);
    });

    // load user file types
    getUserFileTypesConfig().forEach(loadFileType);
};

/**
 * detect compiler pack update
 */
exports.detectUpdate = function () {
    var $       = jQuery,
        il8n    = require('./il8n'),
        fileTypesRepo = require('./appConfig').getAppPackage().maintainers.file_types_repositories;

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

    Object.keys(fileTypes).forEach(function (fileTypeName) {
        // Not delect for built-in fileTypes packs
        if (builtInFileTypeNames.indexOf(fileTypeName) > -1) return false;

        var fileType = fileTypes[fileTypeName],
            url      = fileTypesRepo + '?' + util.createRdStr();
        $.getJSON(url, function (data) {
            if (data[fileTypeName]) {
                var curVersion = fileType.version,
                    newVersion = data[fileTypeName].version;

                if (getVersionNum(newVersion) > getVersionNum(curVersion)) {
                   $.koalaui.confirm(il8n.__('file type pack update notification', fileType.getDisplay("name")), function () {
                        installNewVersion(data[fileTypeName].download);
                   });
                }
            }
        });
    });
}

/**
 * get file types
 * @return {Object} file types
 */
exports.getFileTypes = function () {
    return fileTypes;
};

/**
 * get all effective extensions
 * @return {array} extensions
 */
exports.getAllExtensions = function () {
    return extensions;
};

/**
 * get file type for the given extension, or null if not found.
 * @param  {String} ext an extension.
 * @return {Object} file type for "ext", or null.
 */
exports.fileTypeForExtension = function (ext) {
    for (var k in fileTypes) {
        if (fileTypes[k].extensions.indexOf(ext) > -1) {
            return fileTypes[k];
        }
    }

    return null;
};

/**
 * get file type with the given name, or null if not found.
 * @param  {String} name of the file type.
 * @return {Object} file type named "name", or null.
 */
exports.fileTypeWithName = function (name) {
    return fileTypes[name] || null;
};
