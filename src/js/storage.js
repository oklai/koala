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
		Boolean minify [false] //less output minify
		String outputStyle [nested] //sass outputstyle
		Boolean bare [false] //coffee-script,Compile the JavaScript without the top-level function safety wrapper.
	}
}
*/


var fs = require('fs');
var path = require('path');
var common = require('./common.js');
var config = require('./config.js');
var fileWatcher = require('./fileWatcher.js');

var home = process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME']; 
var userDataFolder =  home + '/' + config.userDataFolder;
//detection folder exists
(function CheckExistsOfUserDataFolder(){
	var exists = fs.existsSync(userDataFolder);
	if(!exists){
		fs.mkdirSync(userDataFolder);
	}	
})();

var projectClass = {
	//数据集合
	data: {},
	//数据文件路径
	dbFile: userDataFolder + '/projects.json',
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
		//遍历该目录下所有文件
		var files = fileClass.getFileList(project.src);

		//创建项目ID
		var id = common.createRdStr();
		project.id = id;
		project.files = files;

		//保存
		projectClass.data[id] = project;
		projectClass.updateJsonDb();

		//监视文件
		var fileList = [];
		for(var k in files) fileList.push(files[k]);
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
		fs.writeFileSync(projectClass.dbFile, JSON.stringify(projectClass.data));
	},
	//初始化
	initialize: function(callback){
		//从文件读取数据
		var dataString = '{}';
		var exists = fs.existsSync(projectClass.dbFile);
		if(exists){
			//read json
			var jsonString = fs.readFileSync(projectClass.dbFile);
			if(jsonString.length > 0) dataString = jsonString;
		}else{
			//若还没有数据文件，创建一个
			fs.writeFileSync(projectClass.dbFile, '');
		}

		projectClass.data = JSON.parse(dataString);
	}
}
//初始化
projectClass.initialize();

//扩展模块
exports.getProjects = projectClass.getAll;
exports.saveProject = projectClass.save;
exports.updateProject = projectClass.update;
exports.deleteProject = projectClass.deleteProject;
exports.updateJsonDb = projectClass.updateJsonDb;


var fileClass = {
	//遍历某个目录下所有文件,返回file模型集合
	getFileList: function(src){
		var fileList = {};
		var files = getFilesOfDire(src);
		
		files.forEach(function(item){
			var id = common.createRdStr();
			var model = {
				id: id,
				type: path.extname(item).replace('.', ''),
				name: path.basename(item),
				src: item,
				output: getDefaultOutput(item)
			}

			fileList[id] = model;
		});

		return fileList;
	}
} 



//遍历获取某个目录下所有文件
function getFilesOfDire(root, callback){
	var files = [];
	var srcSlash = (process.platform == 'win32') ? '\\' : '/';	//区分不同系统的路径斜杠

	function walk(src){
		var dirList = fs.readdirSync(src);
		dirList.forEach(function(item){
			if(fs.statSync(src + srcSlash + item).isDirectory()){
				walk(src + srcSlash + item);
			}else{
				var type = path.extname(item);
				if(config.extensions.join().indexOf(type) > -1){
					files.push(src + srcSlash + item);
				}
			}
		});
	}
	walk(root);

	return files;
}

//获取默认输出文件
function getDefaultOutput(input){
	var suffixs = {
		'.less': '.css',
		'.sass': '.css',
		'.scss': '.css',
		'.coffee': '.js'
	};

	var fileName = path.basename(input);
	var fileType = path.extname(fileName);

	return input.replace(fileType, suffixs[fileType]);
}
