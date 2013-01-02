//配置模块

'use strict';

var fs = require('fs'),
	$ = global.jQuery,
	common = require('./common.js');

//用户配置目录
var userDataFolder = process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'] + '/.koala-debug';

//程序默认配置
var appConfig = {
	userDataFolder: userDataFolder,
	//项目数据文件
	storageFile: userDataFolder + '/projects.json',
	//用户配置文件
	userConfigFile: userDataFolder + '/settings.json',
	//有效文件
	extensions: ['.less']	//其他：'.sass','.scss','.coffee'
};

//用户自定义配置
var defaultUserConfig = {
	//less选项
	less: {
		compress: false
	},
	//sass选项
	sass: {
		style: 'nested',
		compass: false
	},
	//过滤文件
	filter: null
};

//载入用户配置，并合并到appConfig
(function initUserConfig() {
	var config = getUserConfig(),
		userConfig = defaultUserConfig;

	if (config) { 
		//只读取已知选项
		for (var k in defaultUserConfig) {
			userConfig[k] = config[k] || defaultUserConfig[k];
		}
	}

	//less选项严重
	if (typeof(userConfig.less.compress) !== 'boolean') {
		userConfig.less.compress = false;
	}

	//sass选项验证
	var style = userConfig.sass.style;
	if (style !== 'nested' && 
		style !== 'expanded' && 
		style !== 'compact' &&
		style !== 'compressed') {

		userConfig.sass.style = 'nested';
	}
	if (typeof(userConfig.sass.compress) !== 'boolean') {
		userConfig.sass.compress = false;
	}

	//filter
	if (!common.isArray(userConfig.filter)) {
		userConfig.filter = null;
	}

	//合并
	appConfig = $.extend(userConfig, appConfig);
}());

//读取用户配置
function getUserConfig() {
	//文件不存在,直接返回
	if (!fs.existsSync(appConfig.userConfigFile)) {
		return null
	}

	//读取
	var configString = fs.readFileSync(appConfig.userConfigFile);
	if (configString.toString('utf8', 0, configString.length).trim() === '') {
		return null;
	}

	return JSON.parse(configString);
}

//检查用户数据目录是与文件是否存在,创建默认目录与文件
(function CheckExistsOfUserData() {
	//目录
	if (!fs.existsSync(appConfig.userDataFolder)) {
		//创建目录
		fs.mkdirSync(appConfig.userDataFolder);
	}

	//项目数据文件
	if (!fs.existsSync(appConfig.storageFile)) {
		fs.appendFile(appConfig.storageFile, '');
	}

	//用户配置文件
	if (!fs.existsSync(appConfig.userConfigFile)) {
		fs.appendFile(appConfig.userConfigFile, JSON.stringify(defaultUserConfig, null, '\t'));
	}
})();

//模块API
for(var k in appConfig) exports[k] = appConfig[k];