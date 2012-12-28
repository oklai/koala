//主界面

"use strict"; 

var path = require("path");
var jade = require("jade");
var fs = require("fs");

var common = require("./js/common.js");
var storage = require("./js/storage.js");
var jadeManager =  require("./js/jadeManager.js");
var compiler = require("./js/compiler.js");

//渲染主界面
function renderPage(){
	var projects = storage.getProjects(),
		projectsList = [],
		activeProjectFiles = [];

	//遍历数据
	//项目列表
	for(var k in projects){
		projectsList.push(projects[k]);
	}

	if(projectsList.length > 0){
		var activeProject = projectsList[0];
		activeProject.active = true;

		//文件列表
		for(k in activeProject.files){
			activeProjectFiles.push(activeProject.files[k])
		}
	}

	//渲染数据
	var foldersHtml = jadeManager.renderFolders(projectsList),
		filesHtml = jadeManager.renderFiles(activeProjectFiles);

	$("#folders").html(foldersHtml);
	$("#files ul").html(filesHtml);

	//监测文件改变并编译
	compiler.start();
}
renderPage();


//添加项目
function addProject(name, src){
	if(checkIsExist(name, src)) return false;

	var project = {
		name: name,
		src: src
	}
	//保存
	storage.saveProject(project,function(item){
		var foldersHtml = jadeManager.renderFolders([item]);
		$("#folders").append(foldersHtml);
		$("#folders li:last").trigger("click");
	});
}

//检测目录是否已存在
function checkIsExist(name, src){
	$("#folders").each(function(){
		if(name === $(this).text() && src === $(this).data("src")){
			return true;
		}
	}); 
}

//删除项目
function deleteProject(id, callback){
	storage.deleteProject(id);
	if(callback) callback();
}

//切换浏览目录
function browseProject(id, callback){
	var projects = storage.getProjects(),
		files = projects[id].files,
		fileList = [],
		html = "";

	for(var k in files){
		fileList.push(files[k])
	}

	if(fileList.length > 0){
		html = jadeManager.renderFiles(files);
	}

	if(callback) callback(html);
}

//绑定事件
//添加项目
$("#addDirectory").bind("click", function(){
	$("#ipt_addProject").trigger("click");
});
$("#ipt_addProject").bind("change", function(){
	var direPath = $(this).val();
	var direName = direPath.split(path.sep).slice(-1)[0];
	
	addProject(direName, direPath);
});

//浏览项目文件
$("#folders li").live('click', function(){
	var self = $(this),
		id = self.data("id");
	browseProject(id, function(filesHtml){
		$("#files ul").html(filesHtml);

		$('#folders .active').removeClass('active');
		self.addClass("active");
	});
});

//删除项目
$("#deleteDirectory").bind("click", function(){
	var activeProjectElem = $("#folders").find(".active"),
		id = activeProjectElem.data("id");

	deleteProject(id, function(){
		//显示下一个项目
		var nextItem;
		if(activeProjectElem.next().length > 0){
			nextItem = activeProjectElem.next()
		}
		if(activeProjectElem.prev().length > 0){
			nextItem = activeProjectElem.prev()
		}

		if(nextItem){
			nextItem.trigger("click");
		}else{
			$("#files ul").html("");
		}

		//删除自身
		activeProjectElem.remove();
	});
});