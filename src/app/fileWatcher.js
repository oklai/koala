//watch file api

'use strict';

var fs = require('fs'),
	path = require('path'),
	$ = global.jQuery,
	storage = require('./storage.js'),
	compiler = require('./compiler.js');

var projectsDb = storage.getProjects(),
	watchedCollection = {
		//file: {
		//	...
		//	imports: [filesrc,...]
		//}
	},//全局监听文件集合
	importsCollection = {
		//src: [parentSrc,...]
	};//全局import文件集合

/**
 * 添加监听文件
 * @param {Object Array || single Object} fileInfo 文件信息
 */
exports.add = function(fileInfo) {
	if(Array.isArray(fileInfo)){
		fileInfo.forEach(function(item) {
			var pid = item.pid,
				src = item.src,
				file = projectsDb[pid].files[src];
			addWatchListener(src);
			watchedCollection[src] = $.extend({}, file);
		});
	}else{
		var pid = fileInfo.pid,
			src = fileInfo.src;
		addWatchListener(src);
		watchedCollection[src] = $.extend({}, projectsDb[pid].files[src]);
	}
}

/**
 * 删除监听文件
 * @param  {String Array || single String} fileSrc 文件地址
 */
exports.remove = function(fileSrc) {
	if(Array.isArray(fileSrc)){
		fileSrc.forEach(function(item) {
			removeWatchListener(item);
			delete watchedCollection[item];
		});
	}else{
		removeWatchListener(fileSrc);
		delete watchedCollection[fileSrc]
	}
}

/**
 * 更新监听文件
 * @param  {Object Array || single Object} file 文件对象
 */
exports.update = function(fileInfo) {
	if (Array.isArray(fileInfo)) {
		fileInfo.forEach(function(item) {
			//更新
			var pid = item.pid,
				src = item.src,
				file = projectsDb[pid].files[src];
			watchedCollection[src] = $.extend({},watchedCollection[src],file);
		});
	} else {
		//更新
		var pid = fileInfo.pid,
			src = fileInfo.src,
			file = projectsDb[pid].files[src];
		watchedCollection[src] = $.extend({},watchedCollection[src],file);
	}
}

/**
 * 改变自动编译状态
 * @param  {String}   pid            所属项目ID
 * @param  {String}   fileSrc        文件地址
 * @param  {Boolean}  compileStatus  编译状态
 */
exports.changeCompile = function(pid, fileSrc,compileStatus) {
	if (compileStatus && !watchedCollection[fileSrc]) {
		addWatchListener(fileSrc);
		watchedCollection[fileSrc] = projectsDb[pid].files[fileSrc];
	}

	watchedCollection[fileSrc].compile = compileStatus;
}

/**
 * 添加imports文件
 * @param {Array} files   import文件集合
 * @param {Array} paths   import folder path
 * @param {String} srcFile 包含该import的文件
 */
exports.addImports = function(imports, srcFile) {
	var importsString = imports.join(','),
		oldImports = watchedCollection[srcFile].imports || [],
		oldImportsString = oldImports.join(','),
		invalidImports,
		newImports;

	//已失效import
	invalidImports = oldImports.filter(function(item) {
		return importsString.indexOf(item) === -1
	});
	//删除失效import记录
	invalidImports.forEach(function(item) {
		importsCollection[item] = importsCollection[item].filter(function(element) {
			return element !== srcFile;
		});
	});

	//新增import
	newImports = imports.filter(function(item) {
		return oldImportsString.indexOf(item) === -1;
	});
	//记录新增import
	newImports.forEach(function(item) {
		if (importsCollection[item]) {
			//已监听过该文件,直接添加源文件
			importsCollection[item].push(srcFile);
		} else {
			//新建对象
			importsCollection[item] = [srcFile];
			watchImport(item);
		}
	});

	// global.debug(oldImports);
	// global.debug(imports)
	// global.debug(invalidImports)
	// global.debug(newImports)
	// global.debug(importsCollection)
	watchedCollection[srcFile].imports = imports;
}


/**
 * 获取已在监听中的文件
 * @return {Object} 已import对象集合
 */
exports.getWatchedCollection = function() {
	return watchedCollection;
};

/**
 * 获取import对象集合
 * @return {Object} import对象集合
 */
exports.getImportsCollection = function() {
	return importsCollection;
};

/**
 * 赋值importsCollection
 * @param {Obejct} importsDb import数据对象
 */
exports.setImportsCollection = function(importsDb) {
	importsCollection = importsDb;
};


/**
 * 添加文件监听事件
 * @param {String} src 文件地址
 */
function addWatchListener(src) {
	if (watchedCollection[src]) {
		fs.unwatchFile(src);
	}

	fs.watchFile(src, {interval: 1000}, function(curr){
		if (curr.mode === 0) return false;

		//文件改变，编译
		var file = watchedCollection[src];
		if (file.compile) compiler.runCompile(file);
	});
}

/**
 * 删除文件监听事件
 * @param  {String} src 文件地址
 */
function removeWatchListener(src) {
	if (!importsCollection[src] || importsCollection[src].length === 0) {
		fs.unwatchFile(src);	
	}
}

/**
 * 监听import文件,改变时编译所以引用了他的文件
 * @param  {String} fileSrc 文件地址
 */
function watchImport(fileSrc) {
	if (Array.isArray(fileSrc)) {
		fileSrc.forEach(function (item) {
			watch(item);
		});
	} else {
		watch(fileSrc);
	}

	//执行函数
	function watch (src) {
		//取消之前的监听事件
		if (watchedCollection[src]) {
			fs.unwatchFile(src);
		}

		fs.watchFile(src, {interval: 1000}, function(curr) {
			if (curr.mode === 0) return false;
			
			//编译自身
			var self = watchedCollection[src];
			if (self && self.compile) compiler.runCompile(self);

			//编译父文件
			var parents = importsCollection[src];
			parents.forEach(function(item) {
				//仅当文件在监听列表中时执行
				var parent = watchedCollection[item];
				if (parent && parent.compile) {
					compiler.runCompile(parent);
				}
			});
		});
	}
}
exports.watchImport = watchImport;