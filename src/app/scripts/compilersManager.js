/**
 * compilers manager module
 */

'use strict';

var fs          = require('fs-extra'),
    path        = require('path'),
    EventProxy  = require('eventproxy'),
    util        = require('./util.js'),
    il8n        = require('./il8n.js'),
    configManager = require('./appConfigManager.js'),
    Compiler    = require('./Compiler.js'),
    FileManager = require('./FileManager.js'),
    fileTypesManager = require('./fileTypesManager.js'),
    notifier    = require('./notifier.js'),
    $           = jQuery;

exports.builtInCompilers = [];
exports.compilers = {};

/**
 * check compiler's package data
 * @param  {object} data pack data
 * @return {array}      the missing fields
 */
function checkPackageData (data) {
    data = data || {};

    var fields = [];
    ['name', 'main', 'fileTypes', 'version', 'koalaVersion'].forEach(function (k) {
        if (!data[k]) {
            fields.push(k);
        }
    });

    return fields;
}

/**
 * install compiler
 * @param  {string} pack compiler zip pack path
 */
exports.install = function (pack) {
    var loading = $.koalaui.loading(il8n.__('Installing the compiler...')),
        AdmZip = require('adm-zip'), // reading archives
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
        message = il8n.__('The compiler install failed:' + '<br>' + message);
        $.koalaui.alert(message);
    }

    if (!packageJson) {
        showError(il8n.__('Not found the package.json file.'));
        return false;
    }

    // parse package content
    packageData = util.parseJSON(packageContent);

    var missingFields = checkPackageData(packageData);
    if (missingFields.length) {
        showError(il8n.__('Package is not complete', missingFields.join()));
        return false;
    }

    // install the compiler pack
    var displayName = packageData.display || packageData.name,
        compilerDir = path.join(FileManager.userCompilersDir, displayName);

    zip.extractAllTo(compilerDir, true);

    // load new compiler
    exports.addCompiler(packageData, compilerDir);

    // init compiler options
    var name = packageData.name,
        defaultOption = {};

    defaultOption[name] = exports.getDefaultOptionByCompilerName(name);
    configManager.initCompilerOptions(defaultOption);

    loading.hide();
    $.koalaui.tooltip('success', il8n.__('Compiler pack is installed successfully.', displayName));
};

/**
 * uninstall compiler
 * @param  {string} compilerName
 * @param  {Function} callback
 */
exports.uninstall = function (compilerName, callback) {
    var compiler = exports.compilers[compilerName];

    // remove compiler dir
    fs.removeSync(compiler.configPath);

    // delete associated file type
    for (var k in  fileTypesManager.fileTypes) {
        if (fileTypesManager.fileTypes[k].compiler === compilerName) {
            delete fileTypesManager.fileTypes[k];
        }
    }

    // delete self
    delete exports.compilers[compilerName];

    if (callback) callback();
}

/**
 * detect compiler update
 */
exports.detectUpdate = function () {
    var appPackage = configManager.getAppPackage(),
        compilersRepo = appPackage.maintainers.compilers_repositories,
        url = compilersRepo + '?' + util.createRdStr();

    $.getJSON(url, function (data) {
        if (typeof(data) !== 'object') return false;
        showUpgrade(data);
    });

    // show upgrade
    function showUpgrade (data) {
        var newVersions = [];

        // get new versions
        Object.keys(exports.compilers).forEach(function (compilerName) {
            // Not delect for built-in compilers packs
            if (exports.builtInCompilers.indexOf(compilerName) > -1) return false;

            if (data[compilerName]) {
                var oldCompiler = exports.compilers[compilerName],
                    newCompiler = data[compilerName],
                    curVersion = util.parseVersion(oldCompiler.version),
                    curKoalaVersion = util.parseVersion(appPackage.version.replace(/-.*/, '')),
                    newVersion = util.parseVersion(newCompiler.version),
                    targetKoalaVersion = util.parseVersion(newCompiler.koalaVersion.replace(/>=|-.*/, ''));

                if (newVersion > curVersion && curKoalaVersion >= targetKoalaVersion) {
                    newCompiler.name = compilerName;
                    newVersions.push(newCompiler);
                }
            }
        }); 

        if (newVersions.length === 0) return false;

        // version list
        var list = [],
            tmpl = '<a class="externalLink" href="{project}">{name} ({version})</a>';
        newVersions.forEach(function (item) {
            var str = tmpl
            .replace('{project}', item.project)
            .replace('{name}', item.name)
            .replace('{version}', item.version);

            list.push(str);
        });

        $.koalaui.alert(il8n.__('compiler pack update notification', list.join(', ')));
    }
};

/**
 * load built-in compilers
 */
var loadBuiltInCompilers = function () {
    var data = util.readJsonSync(path.join(FileManager.appCompilersDir, "package.json")) || [];
    data.forEach(function (item) {
        exports.builtInCompilers.push(item.name);
        exports.addCompiler(item, FileManager.appCompilersDir);
    });
};

/**
 * load user compilers
 */
var loadUserCompilers = function () {
    var packages = FileManager.getAllPackageJSONFiles(FileManager.userCompilersDir);
    packages.forEach(function (item) {
        var packageData = util.readJsonSync(item);
        
        // check package if complete
        var missingFields = checkPackageData(packageData);
        if (missingFields.length) {
            global.debug(item + ' is not complete, the missing fields: \n' + missingFields.join());
            return false;
        }

        exports.addCompiler(packageData, path.dirname(item));
    });
};

/**
 * add compiler
 * @param {object} data       compiler package data
 * @param {string} configPath compiler package path
 */
exports.addCompiler = function (data, configPath) {
    if (exports.builtInCompilers.indexOf(data.name) === -1) {
        data.isExtension = true;
    }

    data.configPath = configPath;

    // get file type of compiler
    var fileTypes = {};
    data.fileTypes.forEach(function (type) {
        type.compiler = data.name;
        type.icon = path.resolve(configPath, type.icon);
        type.autocompile = type.autocompile === false ? false : true; // default is true
        type.watch = type.watch === false ? false : true; // default is true

        var exts = [].concat(type.extension || type.extensions);
        delete type.extensions;
        delete type.extension;
        exts.forEach(function (ext) {
            fileTypes[ext] = type;
        })
    });
    delete data.fileTypes;

    data.display = data.display || data.name;
    data.options = data.options || [];
    data.advanced = data.advanced || [];

    if (data.projectSettings) {
        data.projectSettings = path.join(configPath, data.projectSettings);
    }

    if (!data.main) {
        // add built-in compiler
        exports.compilers[data.name] = new Compiler(data);
    } else {
        // add compiler expansion
        try {
            var CompilerClass = require(path.resolve(configPath, data.main));
            
            if (typeof CompilerClass !== 'function') {
                global.debug('It\'s not a correct module: ' + path.resolve(configPath, data.main));
                return false;
            }

            exports.compilers[data.name] = new CompilerClass(data);
        } catch (e) {
            global.debug(e);
            $.koalaui.alert('Compiler ' + data.display + ' Error: <br>' + e.message);
        }
    }

    fileTypesManager.addFileType(fileTypes);
};


/**
 * Get Compilers
 * @return {object} compilers
 */
exports.getCompilers = function () {
	return exports.compilers;
}

/**
 * Get Compilers As A Array
 * @return {array} compilers
 */
exports.getCompilersAsArray = function () {
	var compilers = [];
	for (var k in exports.compilers) {
		compilers.push(exports.compilers[k]);
	}
	return compilers;
}

/**
 * Get Compilers Name
 * @return {array} compilers name
 */
exports.getCompilersName = function () {
	var compilersName = [];
	for (var k in exports.compilers) {
		compilersName.push(k);
	}
	return compilersName;
}

/**
 * Get Compiler By Name
 * @param  {string} name compiler name
 * @return {Object}      compiler object
 */
exports.getCompilerByName = function (name) {
	return exports.compilers[name];
}

/**
 * Get Default Settings
 * @param  {object} compiler
 * @return {object} Settings
 */
var getSettings = function (compiler, key) {
	var settings = {};
	compiler[key].forEach(function (item) {
		settings[item.name] = item.default;
	})
	return settings;
}

/**
 * Get Default Options Of All Compilers
 * @return {[type]} [description]
 */
exports.getDefaultOptions = function () {
	var settings = {},
	compilers = exports.compilers;

	for (var k in compilers) {
		settings[k] = {
			options: {},
			advanced: {}
		};
		if (compilers[k].options && compilers[k].options.length) {
			settings[k].options = getSettings(compilers[k], "options");	
		}
		if (compilers[k].advanced && compilers[k].advanced.length) {
			settings[k].advanced = getSettings(compilers[k], "advanced");	
		}
	}
	return settings;
}

/**
 * Get Default Option By Compiler Name
 * @param  {string} name compiler name
 * @return {object}      compiler default option
 */
exports.getDefaultOptionByCompilerName = function (name) {
	var settings = {
		options: {},
		advanced: {}
	},
	compiler = exports.compilers[name];

	if (compiler.options && compiler.options.length) {
		settings.options = getSettings(compiler, "options");	
	}
	if (compiler.advanced && compiler.advanced.length) {
		settings.advanced = getSettings(compiler, "advanced");	
	}

	return settings;
}

/**
 * Merge Global Settings
 * @param  {string} compilerName   
 * @return {object} compilerSettings
 */
exports.getGlobalSettings = function (compilerName) {
	var configManager = require('./appConfigManager.js'),
		globalSettings = configManager.getGlobalSettingsOfCompiler(compilerName),
		// Clone Object
        compilerSettings =  JSON.parse(JSON.stringify(exports.getCompilerByName(compilerName)));

    var options = {};
    compilerSettings.options.forEach(function (item) {
        options[item.name] = globalSettings.options[item.name];
    });
    compilerSettings.options = options;

    var advanced = {};
    compilerSettings.advanced.forEach(function (item) {
        advanced[item.name] = globalSettings.advanced[item.name];
    });
    compilerSettings.advanced = advanced;

    return compilerSettings;
}

/**
 * Compile File
 * @param  {object} file    file object
 * @param  {object} emitter compile event emitter
 * @param  {object} options compile options
 */
exports.compileFile = function (file, emitter, options) {
    if (!fs.existsSync(path.dirname(file.output))) {
		fs.mkdirpSync(path.dirname(file.output));
	}
	if (!emitter) emitter = new EventProxy();

    // callback on compile done
    emitter.on('done', function () {
        var appConfig = configManager.getAppConfig();

        // not notify when manually compile 
        if (!appConfig.notifyOnCompleted || (options && options.manually)) {
            return false
        }

        notifier.throwCompleted('Success.', file.src);    
    });
	
	exports.getCompilerByName(file.compiler).compile(file, emitter);
};

// init
// load all compilers
loadBuiltInCompilers();
loadUserCompilers();

// init compiler default options
configManager.initCompilerOptions(exports.getDefaultOptions());