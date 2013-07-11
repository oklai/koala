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
 * Wraps the object with an array if its not an array.
 * @param  {Object} objectOrArray the object to wrap, or array.
 * @param  {Object} def           the default value to be returned if objectOrArray is falsy. (default `[]`)
 * @return {Array}                the output array or "def".
 */
exports.asArray = function (objectOrArray, def) {
	if (!objectOrArray) {
		return def || [];
	}
	return Array.isArray(objectOrArray) ? objectOrArray : [objectOrArray];
}

/**
 * checks if the given argument is empty ({} or []).
 * @param  {Object}  objectOrArray the object or array to check.
 * @return {Boolean}               true if empty ({} or []), false otherwise.
 */
exports.isEmpty = function (objectOrArray) {
	return !objectOrArray || (Array.isArray(objectOrArray) ? objectOrArray : Object.keys(objectOrArray)).length === 0;
}

/**
 * test if is empty object
 * @param  {Object}  obj 
 * @return {Boolean}
 */
exports.isEmptyObject = function(obj) {
    return exports.isEmpty(obj);
}

/**
 * test if is object
 * @param  {Object}  obj [description]
 * @return {Boolean}     [description]
 */
exports.isObject = function (obj) {
	return typeof obj === "object";
}

/**
 * copy file sync
 * @param  {String} srcFile  src file path
 * @param  {String} destFile dest file path
 */
exports.copyFileSync = function(srcFile, destFile, callback) {
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
function replaceJsonComments (content) {
	if (!content) return '';
	return content.replace(/\".+?\"|\'.+?\'/g, function(s){
		return s.replace(/\/\//g, '@_@');
	}).replace(/\s*?\/\/.*?[\n\r]|[\t\r\n]/g, '').replace(/@_@/g, '//');
}
exports.replaceJsonComments = replaceJsonComments;

/**
 * parse JSON
 * @param  {String} content
 * @return {Object}
 */
function parseJSON (content) {
	content = replaceJsonComments(content);
	try {
		return JSON.parse(content);
	} catch (e) {
		return null;
	}
}
exports.parseJSON = parseJSON;

/**
 * read json file sync
 * @param  {String} file file path
 * @return {Object}      json object
 */
exports.readJsonSync = function (file) {
	var content = fs.readFileSync(file, 'utf8');
	return parseJSON(content);
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
exports.checkUpgrade = function (upgradeUrl, currentVersion, callback, events) {
	events = events || {
		// success: function () {},
		// fail: function () {}
	};

	upgradeUrl += '?' + exports.createRdStr();
	
	jQuery.getJSON(upgradeUrl).done(function (data) {
		if (events.success) events.success();
		versionDetect(data);
	}).fail(function () {
		if (events.fail) events.fail();
	});

	function versionDetect (data) {
		if (!data) {
			callback(null, false);
			return false;
		}

		//not support this platform
		if (data.platform && data.platform.join(',').indexOf(getPlatformName()) === -1) {
			callback(data, false);
			return false;
		}

		var current = getVersionNum(currentVersion),
			target = getVersionNum(data.version),
			hasNewVersion = false;

		if (target.stable > current.stable) hasNewVersion = true;

		if (target.stable === current.stable) {
			if (!target.beta && current.beta) hasNewVersion = true;
			if (target.beta > current.beta) hasNewVersion = true
		} 

		if (callback) {
			callback(data, hasNewVersion);
		}
	}

	function getVersionNum(version) {
		var versionInfo = version.split('-beta'),
			betaNum = versionInfo[1],
			numList = versionInfo[0].split('.'),
			stableNum = 0,
			multiple = 100;

		for (var i = 0;i < 3; i++) {
			if (numList[i] !== undefined) {
				stableNum += numList[i] * multiple;
				multiple = multiple / 10;
			}
		}
		
		return {
			stable: stableNum,
			beta:  betaNum
		};
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
        mode = '0777';
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
        mode = '0777';
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

/**
 * get platform name
 */
function getPlatformName () {
	var names = {
		'win32': 'windows',
		'darwin': 'mac',
		'linux': 'linux'
	};

	return names[process.platform];
}
exports.getPlatformName = getPlatformName;


/**
 * get css imports file path
 * @param  {String}  css         css code
 * @param  {Boolean} hasComments if has replace comments flag
 * @return {[type]}              import files
 */
exports.getCssImports = function (css, hasComments) {
	//less content length
	if (css.length < 15) return null;

	if (hasComments) {
		css = css.replace(/\/\*[\s\S]+?\*\/|[\r\n\t]+\/\/.*/g, '');	
	}

	var imports = css.match(/@import.+?[\"\'](.+?css)[\"\']\;/g) || [],
		imports2 = css.match(/@import.+?url\([\"\'](.+?css)[\"\']\)\;/g) || [];
	
	imports = imports.concat(imports2);

	if (imports.length === 0) return null;

	var importsObj = {};
	imports.forEach(function (item, index) {
		//skip absolute url
		if (/[\"\'"][\/|http]/.test(item)) return null;
		
		importsObj[item] = item.match(/.+?[\"\'](.+?css)[\"\']/)[1];
	});
	return importsObj;
}


/**
 * tmp dir of system
 * @return {String} tmp dir
 */
exports.tmpDir = function () {
	var systemTmpDir = 
			process.env.TMPDIR ||
			process.env.TMP ||
			process.env.TEMP ||
			(process.platform === 'win32' ? 'c:\\windows\\temp' : '/tmp');

	return systemTmpDir + path.sep + 'koala_temp_' + exports.createRdStr();
}

/**
 * download file use nodejs
 * @param  {String} fileUrl     file url
 * @param  {String} downloadDir Save dir
 * @param  {Function} success   
 * @param  {Function} fail       
 */
exports.downloadFile = function (fileUrl, downloadDir, success, fail) {
	// Dependencies
	var url = require('url'),
		http = require('http');

	var urlObj = url.parse(fileUrl);
	var options = {
	    host: urlObj.host,
	    port: urlObj.port || 80,
	    path: urlObj.pathname
	};

	if (!fs.existsSync(downloadDir)) fs.mkdirSync(downloadDir);
	var file = fs.createWriteStream(downloadDir + path.sep + urlObj.pathname.split('/').pop());

	http.get(options, function(res) {
		if (!/200|201/.test(res.statusCode)) {
			fail('File not found!');
			return false;
		}
		
		res.on('data', function(data) {
			file.write(data);
		}).on('end', function() {
			file.end();
			success(file.path);
		})

	}).on('error',function(e){
		fail(e.message);
	});
}