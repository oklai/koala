//添加文件夹
var path = require("path");
var mustache = require("mustache");

var common = require("./js/common.js");
var storage = require("./js/storage.js");

//渲染主界面
function renderPage(){
	var projects = storage.getProjects(),
		projectsList = [],
		activeProject,
		activeProjectFiles = [];

	//遍历数据
	//项目列表
	for(var k in projects){
		projectsList.push(projects[k]);
	}

	if(projectsList.length > 0){
		activeProject = projectsList[0];
		activeProject.active = true;

		//文件列表
		for(var k in activeProject.files){
			activeProjectFiles.push(activeProject.files[k])
		}
	}

	console.log(projectsList)
	console.log(activeProjectFiles)

	//模版
	var temp_projets = $("#temp_projects").html(),
		temp_files = $("#temp_files").html();

	//渲染数据
	var html_projects = mustache.render(temp_projets, {projects: projectsList}),
		html_files = mustache.render(temp_files, {files: activeProjectFiles});

	$("#projects .folders").html(html_projects);
	$("#files ul").html(html_files);
}
renderPage();


function seleteDirectory (evt) {
	var ipt_addDirectory = $("#ipt_addDirectory");
	ipt_addDirectory.trigger("click");
	ipt_addDirectory.bind("change", function(){

		var direPath = $("#ipt_addDirectory").val();
		var direName = direPath.split(path.sep).slice(-1)[0];
		
		addProject(direName, direPath);
		$("#projects .folders").append("<li>{name}</li>".replace("{name}", direName));

		$(this).unbind("change");
	});
}

//检测目录是否已存在
function checkIsExist(name, dir){
	$("#projects .folders").each(function(){
		if(name === $(this).text() && dir === $(this).data("dir")){
			return true;
		}
	});
}

//添加项目
function addProject(name, dir){
	var project = {
		name: name,
		dir: dir
	}

	storage.saveProject(project, function(project){
		console.log(project);
	});
}


//绑定事件
$("#addDirectory").bind("click", seleteDirectory);


// Load native UI library
var gui = require('nw.gui');

// Get the current window
var win = gui.Window.get();

function showDevTools(){
	win.showDevTools();
}
$("#showDevTools").bind("click", showDevTools);