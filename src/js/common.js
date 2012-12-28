//工具函数库
var fs = require("fs");

//创建一个随机字符串
exports.createRdStr = function (customSize) {
	var chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz";
	var size = customSize || 8;
	size = size < 1 ? 8 : size; size = size > chars.length ? 8 : size;

	var s = '';
	for (var i = 0; i < size; i++) {
		var rnum = Math.floor(Math.random() * chars.length);
		s += chars.substring(rnum, rnum + 1);
	}

	return s;
};

exports.isArray = function(obj) {
    return Object.prototype.toString.call(obj) === '[object Array]';
}