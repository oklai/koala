/**
 * CSS min compiler
 */
'use strict';

var fs          = require('fs-extra'),
    cleanCSS    = require('clean-css'),
    FileManager = global.getFileManager(),
    Compiler    = require(FileManager.appScriptsDir + '/Compiler.js');

/**
 * CSS Compiler
 * @param {object} config compiler config
 */
function CssCompiler(config) {
   Compiler.call(this, config);
}
require('util').inherits(CssCompiler, Compiler);

module.exports = CssCompiler;

/**
 * compile css file
 * @param  {Object} file    compile file object
 * @param  {Object} emitter  compile event emitter
 */
CssCompiler.prototype.compile = function(file, emitter) {
    // global.debug(file);

    var path = file.src.substring(0, file.src.indexOf(file.name));
    var source = fs.readFileSync(file.src, 'utf-8');
    var iskeepbreaks = file.settings.outputStyle != "yuicompress" || false;

    // if 'combine import' was chosen
    if (file.settings.combineImport) { 
        var minimized = cleanCSS.process(source, { removeEmpty: true, keepBreaks: iskeepbreaks, relativeTo: path });
    }else {
        var minimized = cleanCSS.process(source, { removeEmpty: true, keepBreaks: iskeepbreaks, processImport: false });
    }

    // convert background image to base64
    var convertion = convertImg2Base64(clearUrl(minimized), path);

    // append timestamp to external assets
    var result = appendTimestamp(convertion);

    fs.outputFile(file.output, result, function(err) {
        if (err) {
            emitter.emit('fail');
        } else {
            emitter.emit('done');
        }
    });
    emitter.emit('always');
};


/**
 * strip '" & blank from url
 * @param  {string} source code
 */
function clearUrl(data) {
    var tempData = [];
    var nextStart = 0;
    var nextEnd = 0;
    var cursor = 0;

    for (; nextEnd < data.length; ) {
        nextStart = data.indexOf('url(', nextEnd);
        if (nextStart == -1)
            break;
        nextEnd = data.indexOf(')', nextStart + 4);
        if (nextEnd == -1)
            break;

        tempData.push(data.substring(cursor, nextStart));
        var url = data.substring(nextStart + 4, nextEnd).replace(/ /g, '').replace(/['"]/g, '');
        tempData.push('url(' + url + ')');
        cursor = nextEnd + 1;
    }
    return tempData.length > 0 ? tempData.join('') + data.substring(cursor, data.length) : data;
}


/**
 * append timestamp to external assets
 * @param  {string} source code
 */
function appendTimestamp(data) {
    var tempData = [];
    var nextStart = 0;
    var nextEnd = 0;
    var cursor = 0;

    for (; nextEnd < data.length; ) {
        nextStart = data.indexOf('url(', nextEnd);
        if (nextStart == -1)
            break;
        nextEnd = data.indexOf(')', nextStart + 4);
        if (nextEnd == -1)
            break;

        tempData.push(data.substring(cursor, nextStart));
        var url = data.substring(nextStart + 4, nextEnd);
        if (url.indexOf('data:image/') == -1) {
            tempData.push('url(' + url + '?' + createTimestamp() +')');
        } else {
            tempData.push('url(' + url + ')');
        }
        cursor = nextEnd + 1;
    }
    return tempData.length > 0 ? tempData.join('') + data.substring(cursor, data.length) : data;
}

/**
 * convert background image to base64
 * @param  {string} source code
 */
function convertImg2Base64(data, curPath) {
    var tempData = [];
    var nextStart = 0;
    var nextEnd = 0;
    var cursor = 0;

    for (; nextEnd < data.length; ) {
        nextEnd = data.indexOf('?base64)', cursor);
        if (nextEnd == -1)
            break;
        nextStart = data.lastIndexOf('url(', nextEnd);
        if (nextStart == -1)
            break;
        
        tempData.push(data.substring(cursor, nextStart));
        var url = data.substring(nextStart + 4, nextEnd);

        url = img2base64(url, curPath);

        tempData.push('url(' + url + ')');
        cursor = nextEnd + 8;
    }
    return tempData.length > 0 ? tempData.join('') + data.substring(cursor, data.length) : data;
}


/**
 * convert image to base64
 * @param  {string} filePath
 */
function img2base64(url, currentPath){

    if (url.indexOf('http://') == -1) { // don't convert the external image

        var typelist = ['jpg', 'png', 'gif', 'bmp'];
        for (var i=0; i<typelist.length; i++) {
          var index = url.lastIndexOf(typelist[i]);

          if (index != -1) {
            var type = url.substring(index, index+3);
            break;
          }
        }
        var prefix = 'data:image/' + type + ';base64,';

        var obj = {
            'url': url,
            'curPath': currentPath
        }
        var nObj = specifyAbsPath(obj);
        try {
            var imageBuf = fs.readFileSync(nObj.curPath + '\\' + nObj.url); 
            return prefix + imageBuf.toString("base64");
        } catch(err) {
            // console.log("the file doesn't exist");
            return url;
        }
    }
    return url;
};


/**
 * specify the absolute path based on the url
 * @param  {string} url strings
 */
function specifyAbsPath(obj) {
    // console.log('origin:' + obj.url +'、'+obj.curPath);

    if (obj.url.indexOf('./') == -1 && obj.url.indexOf('../') == -1) {
        obj.url = obj.url[0] == '/' ? obj.url.substring(1, obj.url.length) : obj.url;
        obj.url = obj.url.replace(/\//g,'\\');
        // console.log('process:' + obj.url +'、'+obj.curPath);
        return obj;
    } else {
        if (obj.url.indexOf('./') != -1 && obj.url.indexOf('../') == -1) {
            obj.url = obj.url.replace(/.\//,'');
        } else {
            obj.url = obj.url.replace(/..\//,'');
            obj.curPath = obj.curPath.substring(0, obj.curPath.lastIndexOf('\\'));
        }
        return specifyAbsPath(obj);
    }
}


/**
 * create timestamp
 */
function createTimestamp() {
    var date = new Date();
    var year = date.getFullYear().toString().substring(2,4);
    var mon = date.getMonth().toString().length == 2 ? date.getMonth()+1 : '0'+(date.getMonth()+1);
    var day = date.getDate().toString().length == 2 ? date.getDate() : '0'+date.getDate();
    var hour = date.getHours().toString().length == 2 ? date.getHours() : '0'+date.getHours();
    var min = date.getMinutes().toString().length == 2 ? date.getMinutes() : '0'+date.getMinutes();

    return year+mon+day+hour+min;
};