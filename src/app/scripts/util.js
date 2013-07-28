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
 * @param  {*}     value the object to wrap, or array.
 * @param  {*}     def   the default value to be returned if value is falsy. (default `[]`)
 * @return {Array}       the output array or "def".
 */
exports.asArray = function (value, def) {
    if (value === null || value === undefined) {
        return def || [];
    }
    return [].concat(value);
};

/**
 * checks if the given argument is empty ({} or []).
 * @param  {Object}  objectOrArray the object or array to check.
 * @return {Boolean}               true if empty ({} or []), false otherwise.
 */
exports.isEmpty = function (objectOrArray) {
    return !objectOrArray || (Array.isArray(objectOrArray) ? objectOrArray : Object.keys(objectOrArray)).length === 0;
};

/**
 * clones this input argument.
 * @param  {*} value the value to clone.
 * @return {*}       the clone of `value`.
 */
exports.clone = function (value) {
    try {
        return JSON.parse(JSON.stringify(value));
    } catch (e) {
        return null;
    }
};

/**
 * test if is empty object
 * @param  {Object}  obj
 * @return {Boolean}
 */
exports.isEmptyObject = exports.isEmpty;

/**
 * test if is object
 * @param  {Object}  obj [description]
 * @return {Boolean}     [description]
 */
exports.isObject = function (obj) {
    return typeof obj === "object";
};

/**
 * replace Json Comments
 * @param  {String} content Json content
 * @return {String}         result
 */
exports.replaceJsonComments = function (content) {
    if (!content) return '';
    return content.replace(/\".+?\"|\'.+?\'/g, function (s) {
        return s.replace(/\/\//g, '@_@');
    }).replace(/\s*?\/\/.*?[\n\r]|[\t\r\n]/g, '').replace(/@_@/g, '//');
};

/**
 * parse JSON
 * @param  {String} content
 * @return {Object}
 */
exports.parseJSON = function (content) {
    content = exports.replaceJsonComments(content);
    try {
        return JSON.parse(content);
    } catch (e) {
        return null;
    }
};

/**
 * read json file sync
 * @param  {String} file file path
 * @return {Object}      json object
 */
exports.readJsonSync = function (file) {
    var content = fs.readFileSync(file, 'utf8');
    return exports.parseJSON(content);
};

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
};

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
        if (data.platform && data.platform.join(',').indexOf(exports.getPlatformName()) === -1) {
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
 * get platform name
 */
exports.getPlatformName = function () {
    var names = {
        'win32': 'windows',
        'darwin': 'mac',
        'linux': 'linux'
    };

    return names[process.platform];
};


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
};

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
    var file = fs.createWriteStream(path.join(downloadDir, urlObj.pathname.split('/').pop()));

    http.get(options, function (res) {
        if (!/200|201/.test(res.statusCode)) {
            fail('File not found!');
            return false;
        }

        res.on('data', function (data) {
            file.write(data);
        }).on('end', function () {
            file.end();
            success(file.path);
        });

    }).on('error',function (e) {
        fail(e.message);
    });
};

/**
 * sync two object properties
 * @param  {object}  source source object
 * @param  {object}  tmpl   tmpl object
 * @return {boolean}        true if the `source` was changed, otherwise false
 */
exports.syncObject = function (source, tmpl) {
    var syncAble = false, i;

    for (i in tmpl) {
        if (source[i] === undefined) {
            source[i] = exports.clone(tmpl[i]);
            syncAble = true;
        } else {
            if (exports.isObject(source[i])) {
                syncAble = syncAble || exports.syncObject(source[i], tmpl[i]);
            }
        }
    }
    
    return syncAble;
};
