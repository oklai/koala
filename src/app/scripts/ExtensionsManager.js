/**
 * extensions manager module
 */

'use strict';

var fs                     = require('fs-extra'),
    path                   = require('path'),
    util                   = require('./util'),
    Extension              = require('./Extension'),
    FileManager            = global.getFileManager(),
    builtInExtensionsNames = [],
    extensions             = {};

/**
 * install the new version compiler pack
 * @param  {String} fileUrl
 */
function installNewVersion (fileUrl) {
    var $       = jQuery,
        il8n    = require('./il8n'),
        loading = $.koalaui.loading(il8n.__('Downloading the new extension pack...'));
    util.downloadFile(fileUrl, FileManager.tmpDir(), function (filePath) {
        loading.hide();
        exports.install(filePath);
    }, function (err) {
        loading.hide();

        err = il8n.__('Extension pack auto download failed, try download it manually.') + '<br>Error: ' + err;
        $.koalaui.alert(err, function () {
            global.gui.Shell.openExternal(fileUrl);
        });
    });
}

exports.install = function (pack) {
    var il8n    = require('./il8n'),
        $       = jQuery,
        loading = $.koalaui.loading(il8n.__('Installing the extension pack...')),

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
        message = il8n.__('Install the compiler pack failed:') + '<br>' + il8n.__(message);
        $.koalaui.alert(message);
    }

    if (!packageJson) {
        showError('Not found the package.json file.');
        return false;
    }

    // parse package content
    packageData = util.parseJSON(packageContent);

    if (!packageData || !packageData.name || !packageData.version) {
        showError('Package.json is not complete.');
        return false;
    }

    // install the extension pack
    var extensionDir = path.join(FileManager.userExtensionsDir, packageData.name);
    zip.extractAllTo(extensionDir, true);

    // load new extension
    var extension = exports.loadExtension(path.join(extensionDir, "package.json"));

    loading.hide();
    $.koalaui.tooltip('success', il8n.__('Extension pack is installed successfully.', extension.getDisplay("name")));
};

/**
 * detect extension pack update
 */
exports.detectUpdate = function () {
    var $       = jQuery,
        il8n    = require('./il8n'),
        extensionsRepo = require('./appConfig').getAppPackage().maintainers.extensions_repositories;

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

    Object.keys(extensions).forEach(function (extensionName) {
        // Not delect for built-in extensions packs
        if (builtInExtensionsNames.indexOf(extensionName) > -1) return false;

        var extension = extensions[extensionName], url;

        if (extension.detectUpdate) {
            extension.detectUpdate(installNewVersion);
        } else {
            url = extensionsRepo + '?' + util.createRdStr();
            $.getJSON(url, function (data) {
                if (data[extensionName]) {
                    var curVersion = extension.version,
                        newVersion = data[extensionName].version;

                    if (getVersionNum(newVersion) > getVersionNum(curVersion)) {
                       $.koalaui.confirm(il8n.__('extension pack update notification', extension.getDisplay("name")), function () {
                            installNewVersion(data[extensionName].download);
                       });
                    }
                }
            });
        }
    });
};

exports.loadBuiltInExtensions = function () {
    require('./fileTypesManager').loadBuiltInFileTypes();
    require('./compilersManager').loadBuiltInCompilers();
};

exports.loadExtension = function (configPath) {
    return exports.addExtensionWithConfig(util.readJsonSync(configPath), path.dirname(configPath));
};

exports.loadExtensions = function () {
    exports.loadBuiltInExtensions();
    FileManager.getAllPackageJSONFiles(FileManager.userExtensionsDir).forEach(exports.loadExtension);
    console.log(require('./fileTypesManager').getFileTypes());
};

exports.addExtensionWithConfig = function (config, dir) {
    var extension, isBuiltIn = false;
    if (!config) {
        return null;
    }
    if (!dir) {
        dir = FileManager.appExtensionsDir;
        isBuiltIn = true;
    }

    extension = new Extension(config, dir);
    extensions[extension.name] = extension;
    if (isBuiltIn) {
        builtInExtensionsNames.push(extension.name);
    }

    return extension;
};

/**
 * get extensions
 * @return {Object} extensions
 */
exports.getExtensions = function () {
    return extensions;
};
