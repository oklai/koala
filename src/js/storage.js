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
	appConfig = require('./appConfig.js').getAppConfig(),
	fileWatcher = require('./fileWatcher.js');

var userDataFolder =  appConfig.userDataFolder;

var projectClass = {
	//数据集合
	data: {},
	//数据文件路径
	dbFile: appConfig.storageFile,
	//获取所有项目
	getAll: function(){
		return projectClass.data;
	},
	//获取指定项目
	get: function(id){
		return projectClass.data[id]
	},
	//保存一个项目
	save: function(project, callback){
		projectClass.data[project.id] = project;
		projectClass.updateJsonDb();

		//监视文件
		var fileList = [];
		for(var k in project.files) {
			fileList.push(project.files[k]);
		}
		fileWatcher.add(fileList);

		//执行回调
		if(callback){
			callback(project);
		}
	},
	//更新项目
	update: function(id, project){
		projectClass.data[id] = project;
		projectClass.updateJsonDb();
	},
	//删除项目
	deleteProject: function(id){
		var fileList = [],
			project = projectClass.data[id];

		for(var k  in project.files) fileList.push(project.files[k]);

		fileWatcher.remove(fileList);//取消对文件的监视

		delete projectClass.data[id];
		projectClass.updateJsonDb();
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
exports.getProjects = projectClass.getAll;
exports.saveProject = projectClass.save;
exports.updateProject = projectClass.update;
exports.deleteProject = projectClass.deleteProject;
exports.updateJsonDb = projectClass.updateJsonDb;