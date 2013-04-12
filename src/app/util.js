/**
 * common
 */

'use strict';

var fs   = require("fs"),
	path = require('path');

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

/**
 * config.rb convert to json
 * @param  {String} configPath config.rb path
 * @return {Object}            result object
 */
exports.configrb2json = function (configPath) {
	var config = fs.readFileSync(configPath).toString();
	//remove comments
	config = config.replace(/^[ ]*=begin[\w\W]*?=end[^\w]|^[ ]*#.*/gm, '').replace(/[\n\t\r]+/g, ',');

	var params = config.split(','),
		result = {};

	params.forEach(function (item) {
		if (item.length) {
			var p = item.split('='),
				key = p[0].trim(),
				val = p[1].trim();

			if (/true|false/.test(val)) {
				val = JSON.parse(val);
			}
			else if (val.indexOf('\'') === 0 || val.indexOf('\"') === 0) {
				val = val.slice(1, val.length - 1);	
			}

			result[key] = val;
		}
	});

	return result;
}

/**
 * is file in some directory
 * @param  {String} fileName file name
 * @param  {String} dir      dir path
 * @return {Boolean}
 */
function inDirectory (fileName, targetDir) {
	if (!fs.existsSync(targetDir)) {
		return;
	}

	var result;

	function wark(dir) {
		var dirList = fs.readdirSync(dir);

		for (var i = 0; i < dirList.length; i++) {
			var item = dirList[i];

			//filter system file
			if (/^\./.test(item)) {
				continue;
			}

			if(fs.statSync(dir + path.sep + item).isDirectory()) {
				wark(dir + path.sep + item);
			} else {
				if (item === fileName) {
					result = dir + path.sep + item;
					break;
				}
			}
		}
	}
	wark(targetDir);

	return result;
}
exports.inDirectory = inDirectory;

/**
 * Check Upgrade
 * @param  {String}   upgradeUrl     upgrade post url
 * @param  {String}   currentVersion 
 * @param  {Function} callback
 */
exports.checkUpgrade = function (upgradeUrl, currentVersion, callback) {
	jQuery.getJSON(upgradeUrl).done(function (data) {
		var current = getVersionNum(currentVersion),
			target = getVersionNum(data.version);
		if (target > current) {
			callback && callback(data);
		}
	});

	function getVersionNum(version) {
		var numList = version.split('.'),
			num = 0,
			multiple = 100;

		for (var i = 0;i < 3; i++) {
			if (numList[i] !== undefined) {
				num += numList[i] * multiple;
				multiple = multiple / 10;
			}
		}
		
		return num;
	}
};


/**
 * recursively mkdir
 * @param  {String} p    dir path
 * @param  {Number} mode mode 
 * @param  {Function} f  callback
 * @param  {object} made 
 */
function mkdirP (p, mode, f, made) {
    if (typeof mode === 'function' || mode === undefined) {
        f = mode;
        mode = 777 & (~process.umask());
    }
    if (!made) made = null;

    var cb = f || function () {};
    if (typeof mode === 'string') mode = parseInt(mode, 8);
    p = path.resolve(p);

    fs.mkdir(p, mode, function (er) {
        if (!er) {
            made = made || p;
            return cb(null, made);
        }
        switch (er.code) {
            case 'ENOENT':
                mkdirP(path.dirname(p), mode, function (er, made) {
                    if (er) cb(er, made);
                    else mkdirP(p, mode, cb, made);
                });
                break;

            // In the case of any other error, just see if there's a dir
            // there already.  If so, then hooray!  If not, then something
            // is borked.
            default:
                fs.stat(p, function (er2, stat) {
                    // if the stat fails, then that's super weird.
                    // let the original error be the failure reason.
                    if (er2 || !stat.isDirectory()) cb(er, made)
                    else cb(null, made);
                });
                break;
        }
    });
}

/**
 * recursively mkdir sync
 * @param  {String} p    dir path
 * @param  {Number} mode mode 
 * @param  {object} made 
 */
function mkdirPSync (p, mode, made) {
    if (mode === undefined) {
        mode = 777 & (~process.umask());
    }
    if (!made) made = null;

    if (typeof mode === 'string') mode = parseInt(mode, 8);
    p = path.resolve(p);

    try {
        fs.mkdirSync(p, mode);
        made = made || p;
    }
    catch (err0) {
        switch (err0.code) {
            case 'ENOENT' :
                made = mkdirPSync(path.dirname(p), mode, made);
                mkdirPSync(p, mode, made);
                break;

            // In the case of any other error, just see if there's a dir
            // there already.  If so, then hooray!  If not, then something
            // is borked.
            default:
                var stat;
                try {
                    stat = fs.statSync(p);
                }
                catch (err1) {
                    throw err0;
                }
                if (!stat.isDirectory()) throw err0;
                break;
        }
    }

    return made;
}

exports.mkdirp = mkdirP;
exports.mkdirpSync = mkdirPSync;