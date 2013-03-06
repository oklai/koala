/**
 * common
 */

'use strict';

var fs = require("fs");

/**
 * create a random  string
 * @param  {Number} customSize string size
 * @return {String}            random string
 */
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

/**
 * test if is empty object
 * @param  {Object}  obj 
 * @return {Boolean}
 */
exports.isEmptyObject = function(obj) {
	var isEmpty = true;
	for(var name in obj){
		isEmpty = false;
		break;
	}
    return isEmpty;
}

/**test if is object
 * [isObject description]
 * @param  {[type]}  obj [description]
 * @return {Boolean}     [description]
 */
exports.isObject = function (obj) {
	var isObject = false;
	for(var name in obj){
		isObject = true;
		break;
	}
	return isObject;
}

/**
 * copy file sync
 * @param  {String} srcFile  src file path
 * @param  {String} destFile dest file path
 */
exports.copyFileSync = function(srcFile, destFile) {
	var BUF_LENGTH, buff, bytesRead, fdr, fdw, pos;

	BUF_LENGTH = 64 * 1024;
	buff = new Buffer(BUF_LENGTH);
	fdr = fs.openSync(srcFile, 'r');
	fdw = fs.openSync(destFile, 'w');
	bytesRead = 1;
	pos = 0;

	while (bytesRead > 0) {
		bytesRead = fs.readSync(fdr, buff, 0, BUF_LENGTH, pos);
		fs.writeSync(fdw, buff, 0, bytesRead);
		pos += bytesRead;
	}

	fs.closeSync(fdr);
	return fs.closeSync(fdw);
};

/**
 * replace Json Comments
 * @param  {String} content Json content
 * @return {String}         result
 */
exports.replaceJsonComments = function (content) {
	return content.replace(/\/\/[^"]+?(?=[\n\r\t])/g, '').replace(/[\r\n\t]+\/\/.+/g, '').replace(/[\n\t\r]+/g, '');
}

/**
 * format date object to string
 * @param  {Object} date date object
 * @param  {String} fmt  format string
 * @return {String}      result string
 * example: dateFormat(new Date(), "yyyy-MM-dd hh:mm:ss")
 */
exports.dateFormat = function (date, fmt) {
	var o = {
	    "M+": date.getMonth() + 1, //月份 
	    "d+": date.getDate(), //日 
	    "h+": date.getHours(), //小时 
	    "m+": date.getMinutes(), //分 
	    "s+": date.getSeconds(), //秒 
	    "q+": Math.floor((date.getMonth() + 3) / 3), //季度 
	    "S": date.getMilliseconds() //毫秒 
	};
	if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (date.getFullYear() + "").substr(4 - RegExp.$1.length));
	for (var k in o)
	if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
	return fmt;
}