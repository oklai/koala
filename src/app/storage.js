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
		String outputStyle [nested] //outputstyle
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
		if (!fs.existsSync(projectClass.dbFile)) {
			fs.appendFile(projectClass.dbFile, '');
		} else {
			var jsonString = fs.readFileSync(projectClass.dbFile, 'utf8');
			try {
				projectClass.data = JSON.parse(jsonString);
			} catch (e) {
				
			}
		}
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
	var data = {};

	if (fs.existsSync(appConfig.importsFile)) {
		var jsonString = fs.readFileSync(appConfig.importsFile, 'utf8');
		try {
			data = JSON.parse(jsonString);
		} catch (e) {

		}
	}

	return data;
};


/**
 * 保存import文件记录
 */
exports.saveImportsDb = function (json) {
	var fd = fs.openSync(appConfig.importsFile, 'w');
	fs.writeSync(fd, json);
	fs.closeSync(fd);
};

