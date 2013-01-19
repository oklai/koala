//配置模块

'use strict';

var fs = require('fs'),
	path = require('path'),
	gui = global.gui,
	$ = global.jQuery,
	exec = require('child_process').exec,
	notifier = require('./notifier.js'),
	common = require('./common.js');

//获取package.json配置
var appPackage = (function() {
	var packageString = fs.readFileSync(process.cwd() + '/package.json', 'utf8');
	try {
		return JSON.parse(packageString);
	} catch (e) {
		global.debug('no package settings');
		return  {};
	}
})();

//用户配置目录
var userDataFolder = process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'] + path.sep + (appPackage.appinfo.debug ? '.koala-debug' : '.koala');
	if (!fs.existsSync(userDataFolder)) {
		//创建目录
		fs.mkdirSync(userDataFolder);
	}

//程序默认配置
var appConfig = {
	userDataFolder: userDataFolder,
	//项目数据文件
	projectsFile: userDataFolder + path.sep + 'projects.json',
	//用户配置文件
	userConfigFile: userDataFolder + path.sep + 'settings.json',
	//记录imports文件 
	importsFile: userDataFolder + path.sep + 'imports.json',
	//有效文件
	extensions: ['.less','.sass','.scss','.coffee']	//其他：'less','.sass','.scss','.coffee'
};

//用户自定义配置
var defaultUserConfig = {
	//less选项
	less: {
		compress: false,
		yuicompress: false
	},
	//sass选项
	sass: {
		outputStyle: 'nested'
	},
	coffeescript: {
		bare: false
	},
	//过滤文件
	filter: []
};

//载入用户配置，并合并到appConfig
var initUserConfig = function() {
	global.debug('initUserConfig');

	var config = getUserConfig(),
		userConfig;

	userConfig = $.extend({},defaultUserConfig, config);

	var lessConfig = userConfig.less,
		sassConfig = userConfig.sass,
		coffeeConfig = userConfig.coffeescript;

	//less选项严重
	if (typeof(lessConfig.compress) !== 'boolean') {
		lessConfig.compress = false;
	}
	if (typeof(lessConfig.yuicompress) !== 'boolean') {
		lessConfig.yuicompress = false;
	}

	//sass选项验证
	if (!/nested|expanded|compact|compressed/.test(sassConfig.outputStyle)) {
		sassConfig.outputStyle = 'nested';
	}

	//coffeescript选项验证
	if (typeof(coffeeConfig.bare) !== 'boolean') {
		coffeeConfig.bare = false;
	}

	//文件过滤选项验证
	if (!Array.isArray(userConfig.filter)) {
		userConfig.filter = [];
	}

	//合并
	['less', 'sass', 'coffeescript', 'filter'].forEach(function(key) {
		appConfig[key] = userConfig[key];
	});

	//检测是否已安装ruby或java
	if (!appConfig.rubyEnable && !appConfig.javaEnable) {
		checkRvmEnable();
	}

	global.debug(appConfig)
}

//读取用户配置
function getUserConfig() {
	//文件不存在,直接返回
	if (!fs.existsSync(appConfig.userConfigFile)) {
		fs.appendFile(appConfig.userConfigFile, JSON.stringify(defaultUserConfig, null, '\t'));
		return null
	}

	//读取
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

//检测是否已安装ruby运行环境
function checkRvmEnable() {
	//检测是否已安装ruby
	exec('ruby -v', {timeout: 5000}, function(error){
		if (error !== null) {
			appConfig.rubyEnable = false;
			checkJavaEnable();
		} else {
			appConfig.rubyEnable = true;
		}
	});

	//查看是否已安装java
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


//检查用户数据目录是与文件是否存在,创建默认目录与文件
function makeExistsOfUserFolder() {
	
}

//获取程序配置
exports.getAppConfig = function() {
	return appConfig;
};

//模块初始化
exports.init = initUserConfig;