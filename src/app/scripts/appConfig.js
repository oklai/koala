/**
 * application config module
 */

'use strict';

var fs     = require('fs'),
	path   = require('path'),
	exec   = require('child_process').exec,
	util   = require('./util.js'),
	compilersManager = require('./compilersManager'),
	$      = global.jQuery;

// get config from package.json
var appPackage = (function() {
	var packageString = fs.readFileSync(process.cwd() + '/package.json', 'utf8');
	packageString = util.replaceJsonComments(packageString);
	try {
		return JSON.parse(packageString);
	} catch (e) {
		return  {};
	}
})();

// user data folder
var userDataFolder = process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'] + path.sep + '.koala';
	if (!fs.existsSync(userDataFolder)) {
		// make user data folder
		fs.mkdirSync(userDataFolder);
	}

// default config of application
var appConfig = {
	version: appPackage.version,
	userDataFolder: userDataFolder,
	// projects data file
	projectsFile: userDataFolder + path.sep + 'projects.json',
	// user config data file
	userConfigFile: userDataFolder + path.sep + 'settings.json',
	// import file record data file
	importsFile: userDataFolder + path.sep + 'imports.json',
	historyFile: userDataFolder + path.sep + 'history.json',
	builtInLanguages: ['en_us', 'zh_cn', 'ja_jp']
};

// default config of user
var defaultUserConfig = {
	appVersion: appPackage.version,
	// filter file suffix
	filter: [],
	languages: [{
		name: 'English',
		code: 'en_us'
	}, 
	{
		name: '简体中文',
		code: 'zh_cn'
	},
	{
		name: '日本語',
		code: 'ja_jp'
	}],
	locales: 'en_us', // default locales
	minimizeToTray: true,
	minimizeOnStartup: false
};

var waitForReplaceFields = ['languages'];

/**
 * load user config
 */
function initUserConfig() {
	var config = getUserConfig() || {};

	//sync config
	var i, j, syncAble = false;
	for (j in defaultUserConfig) {
		if (config[j] === undefined) {
			config[j] = defaultUserConfig[j];
			syncAble = true;
		} else {
			if (util.isObject(config[j])) {
				for (i in defaultUserConfig[j]) {
					if (config[j][i] === undefined) {
						config[j][i] = defaultUserConfig[j][i];
						syncAble = true;
					}
				}
			}
		}
	}
	var defaultCompilerConfig = compilersManager.getDefaultConfig();
	for (j in defaultCompilerConfig) {
		if (config[j] === undefined) {
			config[j] = defaultCompilerConfig[j];
			syncAble = true;
		} else {
			if (util.isObject(config[j])) {
				for (i in defaultCompilerConfig[j]) {
					if (config[j][i] === undefined) {
						config[j][i] = defaultCompilerConfig[j][i];
						syncAble = true;
					}
				}
			}
		}
	}

	// replace the specified settings
	if (config.appVersion !== appPackage.version && waitForReplaceFields.length) {
		waitForReplaceFields.forEach(function (key) {
			config[key] = defaultUserConfig[key];
		});
		syncAble = true;
	}

	if (syncAble) {
		fs.writeFile(appConfig.userConfigFile, JSON.stringify(config, null, '\t'));
	}

	//merge user config to global config
	for (var k in config) {
		appConfig[k] = config[k];
	}

	//detect if satisfy ruby runtime environment
	//checkModulesAvailable();
}

/**
 * load user config
 * @return {Object} user config
 */
function getUserConfig() {
	//no user config,return null 
	if (!fs.existsSync(appConfig.userConfigFile)) {
		fs.appendFile(appConfig.userConfigFile, JSON.stringify(defaultUserConfig, null, '\t'));
		return null
	}

	//read content
	var configString = fs.readFileSync(appConfig.userConfigFile);
	if (configString.toString('utf8', 0, configString.length).trim() === '') {
		return null;
	}

	try {
		return JSON.parse(configString);
	} catch (e) {
		return null;
	}
}

/**
 * check for module available status
 */
function checkModulesAvailable() {
	//check for ruby and compiler
	['ruby', 'sass', 'lessc', 'coffee'].forEach(function (item) {
		var command = item + ' -v',
			key = item + 'Available';

		exec(command, {timeout: 5000}, function(error){
			if (error !== null) {
				appConfig[key] = false;
			} else {
				appConfig[key] = true;
			}
		});
	});
}

/**
 * get app config
 * @return {Object} app config
 */
exports.getAppConfig = function() {
	return appConfig;
};

/**
 * get app package info
 * @return {Object} package object
 */
exports.getAppPackage = function () {
	return appPackage;
}

compilersManager.loadCompilers();
//module initialization
initUserConfig();