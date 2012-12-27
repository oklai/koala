//添加文件夹
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
		for(var k in activeProject.files){
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
function addProject(name, dir){
	if(checkIsExist(name, dir)) return false;

	var project = {
		name: name,
		dir: dir
	}
	//保存
	storage.saveProject(project,function(item){
		var foldersHtml = jadeManager.renderFolders([item]);
		$("#folders").append(foldersHtml);
		$("#folders li:last").trigger("click");
	});
}

//检测目录是否已存在
function checkIsExist(name, dir){
	$("#folders").each(function(){
		if(name === $(this).text() && dir === $(this).data("dir")){
			return true;
		}
	});
}

//删除项目
function deleteProject(id, callback){
	storage.deleteProject(id);
	callback && callback();
}

//切换浏览目录
function BrowseProject(id, callback){
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

	callback && callback(html);
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
	BrowseProject(id, function(filesHtml){
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
	})
});

