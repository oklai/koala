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
	projectsFile: userDataFolder + '/projects.json',
	//用户配置文件
	userConfigFile: userDataFolder + '/settings.json',
	//有效文件
	extensions: ['.less','.sass']	//其他：'less','.sass','.scss','.coffee'
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
	filter: []
};

//载入用户配置，并合并到appConfig
var initUserConfig = function() {
	var config = getUserConfig(),
		userConfig;

	userConfig = $.extend(defaultUserConfig, config);

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
	if (typeof(userConfig.sass.compass) !== 'boolean') {
		userConfig.sass.compass = false;
	}

	//filter
	if (!Array.isArray(userConfig.filter)) {
		userConfig.filter = [];
	}

	//合并
	appConfig = $.extend(userConfig, appConfig);
}

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

//初始化用户配置
initUserConfig();

//监测配置文件变动
fs.watchFile(appConfig.userConfigFile, {interval: 1000}, function() {
	initUserConfig();
});

//检查用户数据目录是与文件是否存在,创建默认目录与文件
(function CheckExistsOfUserData() {
	//目录
	if (!fs.existsSync(appConfig.userDataFolder)) {
		//创建目录
		fs.mkdirSync(appConfig.userDataFolder);
	}

	//项目数据文件
	if (!fs.existsSync(appConfig.projectsFile)) {
		fs.appendFile(appConfig.projectsFile, '');
	}

	//用户配置文件
	if (!fs.existsSync(appConfig.userConfigFile)) {
		fs.appendFile(appConfig.userConfigFile, JSON.stringify(defaultUserConfig, null, '\t'));
	}
})();

//模块API
//获取程序配置
exports.getAppConfig = function() {
	return appConfig;
};