//配置模块

'use strict';

var _exports = {
	//用户配置目录
	userDataFolder: '.koala-debug',
	//开启调试模式
	debug: true,
	//有效文件
	extensions: ['.less']	//其他：'.sass','.scss','.coffee'
};

for(var k in _exports) exports[k] = _exports[k];