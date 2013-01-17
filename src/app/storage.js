//数据存储模块

'use strict';

/*
//项目成员 model
class projectItem
	String id
	Object project

项目对象模型
class project{
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
	String type
	String name
	String src
	String output
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
	initialize: function(callback){
		//从文件读取数据
		var dataString = '{}';

		var jsonString = fs.readFileSync(projectClass.dbFile);
		if(jsonString.length > 0) {
			dataString = jsonString;
		}

		projectClass.data = JSON.parse(dataString);
	}
}
//初始化
projectClass.initialize();

//模块API
exports.getProjects = projectClass.getData;
exports.updateJsonDb = projectClass.updateJsonDb;