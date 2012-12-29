//主界面

'use strict'; 

var path = require('path');
var jade = require('jade');
var fs = require('fs');

//share global context
var gui = require('nw.gui'); 
global.gui = gui;
global.mainWindow = gui.Window.get();
global.$ = jQuery;

var common = require('./js/common.js');
var storage = require('./js/storage.js');
var jadeManager =  require('./js/jadeManager.js');
var fileWatcher = require('./js/fileWatcher.js');
var projectManager = require('./js/projectManager.js');

//===========程序初始化=============
//渲染主界面
(function renderPage() {
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

	$('#folders').html(foldersHtml);
	$('#files ul').html(filesHtml);
}());

//start watch file changes
(function startWatcher() {
	//获取文件列表
	var allProjects = storage.getProjects(),
		allFiles = [];

	for(var k in allProjects){
		var filsItem = allProjects[k].files;
		for(var j in filsItem){
			allFiles.push(filsItem[j]);
		}
	}

	if(allFiles.length === 0) return false;

	//监视文件改动
	console.log(allFiles)
	fileWatcher.add(allFiles);
}());


//=============绑定DOM事件================
//添加项目
$('#addDirectory').bind('click', function(){
	$('#ipt_addProject').trigger('click');
});
$('#ipt_addProject').bind('change', function(){
	var direPath = $(this).val();

	projectManager.addProject(direPath, function(item) {
		var foldersHtml = jadeManager.renderFolders([item]);
		$('#folders').append(foldersHtml);
		$('#folders li:last').trigger('click');
	});
});

//浏览项目文件
$('#folders li').live('click', function(){
	var self = $(this),
		id = self.data('id');

	projectManager.browseProject(id, function(filesHtml){
		$('#files ul').html(filesHtml);

		$('#folders .active').removeClass('active');
		self.addClass('active');
	});
});

//删除项目
$('#deleteDirectory').bind('click', function(){
	var activeProjectElem = $('#folders').find('.active'),
		id = activeProjectElem.data('id');

	projectManager.deleteProject(id, function(){
		//显示下一个项目
		var nextItem;
		if(activeProjectElem.next().length > 0){
			nextItem = activeProjectElem.next()
		}
		if(activeProjectElem.prev().length > 0){
			nextItem = activeProjectElem.prev()
		}

		if(nextItem){
			nextItem.trigger('click');
		}else{
			$('#files ul').html('');
		}

		//删除自身
		activeProjectElem.remove();
	});
});