//数据存储模块

'use strict';

/*
//项目成员 model
class projectItem
	String id
	Object project

项目对象模型
class project{
	String id
	String name
	String src
	Boolean active
	Object files
	
}

文件对象模型
class files{
	String id
	Object file
}
class file{
	String id
	String pid
	String type
	String name
	String src
	String output
	Boolean compile
	Array  imports
	Object settings{
		Boolean compress [false] //less output minify
		String outputStyle [nested] //sass outputstyle
	}
}
*/

var fs = require('fs'),
	path = require('path'),
	common = require('./common.js'),
	appConfig = require('./appConfig.js').getAppConfig();

var projectClass = {
	//数据集合
	data: {},
	//数据文件路径
	dbFile: appConfig.projectsFile,
	//获取所有项目
	getData: function(){
		return projectClass.data;
	},
	//保存数据到文件
	updateJsonDb: function(){
		fs.writeFileSync(projectClass.dbFile, JSON.stringify(projectClass.data, null, '\t'));
	},
	//初始化
	initialize: function(){
		//从文件读取数据
		var dataString = '{}';

		var jsonString = fs.readFileSync(projectClass.dbFile, 'utf8');
		if(jsonString.length > 0) {
			dataString = jsonString;
		}

		projectClass.data = JSON.parse(dataString);
	}
}

//模块初始化
projectClass.initialize();

//获取project数据
exports.getProjects = projectClass.getData;

//保存project数据
exports.updateJsonDb = projectClass.updateJsonDb;


/**
 * 读取imports记录
 * @return {Obeject} importsCollection对象
 */
exports.getImportsDb = function () {
	//从文件读取数据
	var dataString = '{}';

	var jsonString = fs.readFileSync(appConfig.importsFile, 'utf8');
	if(jsonString.length > 0) {
		dataString = jsonString;
	}
	return JSON.parse(dataString);
};


/**
 * 保存import文件记录
 */
exports.saveImportsDb = function (json) {
	var fd = fs.openSync(appConfig.importsFile, 'w');
	fs.writeSync(fd, json);
	fs.closeSync(fd);
};

