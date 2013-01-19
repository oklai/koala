//主界面

'use strict'; 

//测试启动时间
global.startTime = new Date();

//share main context
var gui = require('nw.gui'); 
global.gui = gui;
global.mainWindow = gui.Window.get();
global.jQuery = jQuery;
global.debug = function(messge) {
	global.mainWindow.window.console.log(messge);
};

//require lib
var path = require('path'),
	storage = require('./app/storage.js'),
	projectManager = require('./app/projectManager.js'),
	notifier = require('./app/notifier.js'),
	jadeManager =  require('./app/jadeManager.js');

//just for debug
var fileWatcher = require('./app/fileWatcher.js');

//Application initialization
require('./app/initialization.js').init();

//=============绑定DOM事件================
//添加项目
$('#addDirectory').bind('click', function(){
	$('#ipt_addProject').trigger('click');
});
$('#ipt_addProject').bind('change', function(){
	var direPath = $(this).val();
	
	projectManager.addProject(direPath, function(item) {
		var folderHtml = jadeManager.renderFolders([item]);
		$('#folders').append(folderHtml);
		$('#folders li:last').trigger('click');
	});

	$(this).val('')
});

//浏览项目文件
$('#folders li').live('click', function(){
	var self = $(this),
		id = self.data('id');

	var projectsDb = storage.getProjects(),
		files = projectsDb[id].files,
		fileList = [],
		html = '';

	for(var k in files) {
		fileList.push(files[k])
	}

	if(fileList.length > 0) {
		html = jadeManager.renderFiles(files);
	}

	$('#files ul').html(html);
	$('#folders .active').removeClass('active');

	self.addClass('active');
});

//删除项目
$('#deleteDirectory').bind('click', function(){
	var activeProjectElem = $('#folders').find('.active');

	if (!activeProjectElem[0]) {
		return false;
	}

	var id = activeProjectElem.data('id');

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

//改变输出目录
$('#ipt_fileOutput').change(function() {
	var projectsDb = storage.getProjects(),
		output = $(this).val(),
		outputType = path.extname(output),
		pid = $('#folders').find('.active').data('id'),
		fileSrc = $('#ipt_fileData').val(),
		file = projectsDb[pid].files[fileSrc];

	if (output.length === 0 || file.output === output) {
		return false;
	}

	var suffixs = {
		'less': '.css',
		'sass': '.css',
		'scss': '.css',
		'coffee': '.js'
	};
	if (outputType !== suffixs[file.type]) {
		notifier.alert('please select a ' + suffixs[file.type] + ' file');
		return false;
	}

	//提交更新
	projectManager.updateFile(pid, fileSrc, {output: output}, function() {
		$('#' + file.id).find('.output span').text(output);
	});
});
$('.changeOutput').live('click', function() {
	var src = $(this).closest('li').data('src');
	$('#ipt_fileData').val(src);
	$('#ipt_fileOutput').trigger('click');
});

//用户设置
$('#settings').click(function() {
	var option = {
		position: 'center',
		width: 800,
		height: 600,
		show: false,
		toolbar: false
	};

	gui.Window.open('settings.html', option);
});

//更新目录
$('#refresh').click(function() {
	var id = $('#folders .active').data('id'),
		html;

	if (!id) return false;

	projectManager.refreshProject(id, function(files) {
		html = jadeManager.renderFiles(files);
		$('#files ul').html(html);
	});
});

//取消编译
$('.settings .notcompile').live('change', function(){
	var fileItem = $(this).closest('li'),
		fileSrc = fileItem.data('src'),
		pid = $(fileItem).data('pid'),
		compileStatus = !this.checked;
		
	projectManager.updateFile(pid, fileSrc, {compile: compileStatus}, function() {
		if (!compileStatus) {
			fileItem.addClass('disable');
		} else {
			fileItem.removeClass('disable');
		}
	});
});

//change output style
$('.settings .outputStyle').live('change', function () {
	var style = this.value,
		changeValue = {settings: {
			outputStyle: style
		}},
		pid = $(this).closest('li').data('pid'),
		fileSrc = $(this).closest('li').data('src');

	projectManager.updateFile(pid, fileSrc, changeValue);
});

//turn sass compass mode
$('.settings .compass').live('change', function () {
	var status = this.checked,
		changeValue = {settings: {
			compass: status
		}},
		pid = $(this).closest('li').data('pid'),
		fileSrc = $(this).closest('li').data('src');

	projectManager.updateFile(pid, fileSrc, changeValue);
});


// global.walk = function (root) {
// 	var child = require('child_process').fork(process.cwd() + '/app/walkDirectory.js');
// 	child.on('message', function(data){
// 		global.debug(data);
// 	});

// 	child.send(root);
// }