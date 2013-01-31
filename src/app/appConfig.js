/**
 * application config module
 */

'use strict';

var fs = require('fs'),
	path = require('path'),
	$ = global.jQuery,
	exec = require('child_process').exec;

//get config from package.json
var appPackage = (function() {
	var packageString = fs.readFileSync(process.cwd() + '/package.json', 'utf8');
	try {
		return JSON.parse(packageString);
	} catch (e) {
		return  {};
	}
})();

//user data folder
var userDataFolder = process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'] + path.sep + (appPackage.appinfo.debug ? '.koala-debug' : '.koala');
	if (!fs.existsSync(userDataFolder)) {
		//make user data folder
		fs.mkdirSync(userDataFolder);
	}

//default config of application
var appConfig = {
	userDataFolder: userDataFolder,
	//projects data file
	projectsFile: userDataFolder + path.sep + 'projects.json',
	//user config data file
	userConfigFile: userDataFolder + path.sep + 'settings.json',
	//import file record data file
	importsFile: userDataFolder + path.sep + 'imports.json',
	historyFile: userDataFolder + path.sep + 'history.json',
	//valid file suffix
	extensions: ['.less','.sass','.scss','.coffee'],
	locales: 'en_us', //default locales
	minimizeToTray: true
};

//default config of user
var defaultUserConfig = {
	//less comlipe options
	less: {
		compress: false,
		yuicompress: false
	},
	//sass comlipe options
	sass: {
		outputStyle: 'nested'
	},
	//coffee comlipe options
	coffeescript: {
		bare: false
	},
	//filter file suffix
	filter: [],
	locales: 'en_us',
	minimizeToTray: true
};

/**
 * load user config
 */
function initUserConfig() {
	//global.debug('initUserConfig');

	var config = getUserConfig(),
		userConfig;

	userConfig = $.extend({},defaultUserConfig, config);

	//merge user config to global config
	for (var k in userConfig) {
		appConfig[k] = userConfig[k];
	}

	//detect if satisfy ruby runtime environment
	checkRvmEnable();

	//global.debug(appConfig)
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
		return {};
	}
}

/**
 * detect if satisfy ruby runtime environment
 * @return {Boolean} satisfy status
 */
function checkRvmEnable() {
	//detect if installed ruby
	exec('ruby -v', {timeout: 5000}, function(error){
		if (error !== null) {
			appConfig.rubyEnable = false;
			checkJavaEnable();
		} else {
			appConfig.rubyEnable = true;
		}
	});

	//detect if installed java
	function checkJavaEnable() {
		exec('java -version', {timeout: 5000}, function(error){
			if (error !== null) {
				appConfig.javaEnable = false;
			} else {
				appConfig.javaEnable = true;
			}
		});
	}
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

//module initialization
initUserConfig();