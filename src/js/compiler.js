var fs = require("fs");
var path = require("path");

var storage = require("./storage.js");

exports.start = function(){
	//获取文件列表
	var allProjects = storage.getProjects(),
		allFiles = [];

	for(var k in allProjects){
		var filsItem = allProjects[k].files;
		for(j in filsItem){
			allFiles.push(filsItem[j]);
		}
	}

	if(allFiles.length === 0) return false;

	//监视文件改动
	watchFile(allFiles);
}

//监视文件改动
function watchFile(files){
	files.forEach(function(item){
		fs.watchFile(item.dir, {interval: 1000}, function(curr){
			//文件改变，编译
		  	console.log(item.dir + " is change");
		  	compile(item);
		});
	});
}

//编译文件
var less = require("less");
console.log(less)
function compile(file){

}