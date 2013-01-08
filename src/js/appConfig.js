//配置模块

'use strict';

var fs = require('fs'),
	path = require('path'),
	gui = global.gui,
	$ = global.jQuery,
	notifier = require('./notifier.js');

//用户配置目录
var userDataFolder = process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'] + path.sep + '.koala-debug';

//程序默认配置
var appConfig = {
	userDataFolder: userDataFolder,
	//项目数据文件
	projectsFile: userDataFolder + path.sep + 'projects.json',
	//用户配置文件
	userConfigFile: userDataFolder + path.sep + 'settings.json',
	//有效文件
	extensions: ['less','.sass','.scss','.coffee'],	//其他：'less','.sass','.scss','.coffee'
	sassEnable: true
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

	global.debug(appConfig)
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

	try {
		return JSON.parse(configString);
	} catch (e) {
		return {};
	}
}

//查看sass是否安装
function checkSassEnable() {
	var exec = require('child_process').exec;
	var sassExec = exec('sass -v', {timeout: 5000}, function(error){
    if (error !== null) {
		appConfig.sassEnable = false;

		var message = 'execute sass command failed\n' + error.message + '\n' + 'you need install sass first.'
		notifier.throwGeneralError(message);
    }
	});
}

//初始化用户配置
checkSassEnable();
initUserConfig();

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

//监测配置文件变动
fs.watchFile(appConfig.userConfigFile, {interval: 1000}, function() {
	initUserConfig();
});

//模块API
//获取程序配置
exports.getAppConfig = function() {
	return appConfig;
};