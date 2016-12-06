/**
 * FontGenerator
 */

'use strict';

var FileManager = global.getFileManager(),
    util = require('../util'),
    Compiler    = require(FileManager.appScriptsDir + '/Compiler.js'),
    path = require('path');

/**
 * FontGenerator
 * @param {object} config compiler config
 */
function FontGenerator(config) {
    Compiler.call(this, config);
}
require('util').inherits(FontGenerator, Compiler);

module.exports = FontGenerator;

/**
 * font generator utils
 */
FontGenerator.prototype.utils = {
    getFileExtension: function(font){
        var match = font.match(/\.([^.]+)$/);
        if (match && match[1])
            return match[1];
    }
}

/**
 * compile file
 * @param  {Object} file    compile file object
 * @param  {Object} emitter  compile event emitter
 */
FontGenerator.prototype.compile = function (file, emitter) {
    var self = this,
        globalSettings = this.getGlobalSettings(),
        platform = util.getPlatformName();

    file.supported = ['ttf', 'otf', 'svg', 'woff', 'eot'];
    var fontforgeConvert = self.compileByFontforge(file);

    if (platform === 'windows' && !fontforgeConvert ){
        emitter.emit('fail');
        emitter.emit('always');
        return self.throwError('please configure fontforge path!', file.src);
    };

    self.execProcess(fontforgeConvert, function(err, stdout, stderr) {
        if (err) {
            emitter.emit('fail');
            emitter.emit('always');
            return self.throwError(stderr.toString('utf8'), file.src);
        }
        self.compileEotFont(file, emitter);
    });
}

/**
 * compile font by fontforge
 * supported: ttf, otf, svg, woff
 * @param  {Object} file    compile file object
 */
FontGenerator.prototype.compileByFontforge = function (file) {
    var self = this,
        globalSettings = this.getGlobalSettings(),
        platform = util.getPlatformName(),
        escapestr = platform === 'windows' ? '\"' : '\'',
        executable = globalSettings.advanced.commandPath ? '"' + globalSettings.advanced.commandPath + '"' : 'fontforge',
        ext = self.utils.getFileExtension(file.name.toString()),
        convertString = ['Open($1)'];

    file.outputDir = file.output;

    // windows: fontforge.bat
    if (platform === 'windows' && !globalSettings.advanced.commandPath) {
        return false;
    };
    if (platform !== 'windows') {
        executable += ' -lang=ff';
    };
    executable += ' -c';

    file.supported.pop(); // delete eot
    file.supported.splice(file.supported.indexOf(ext), 1); // delete ext
    file.supported.forEach(function(item) {
        if (platform === 'windows') {
            convertString.push('Generate($2+\'.' + item + '\')');
            file.outputDir = path.join(file.output, file.name).slice(0,-(ext.length + 1));
        } else {
            convertString.push('Generate($2 + $1:t:r + ".' + item + '")');
            file.outputDir = path.join(file.output, file.name).slice(0,-file.name.length);
        }
    });

    // if outputDir has changed, generate source font
    if (file.outputDir != file.src.slice(0, -file.name.length)) {
        platform !== 'windows' ? convertString.push('Generate($2 + $1:t:r + ".'+ ext +'")') : convertString.push('Generate($2+\'.'+ ext +'\')');
    }

    convertString =  escapestr + convertString.join(';') + escapestr;
   
    var args = [file.src, file.outputDir].join(' ');
    return [executable, convertString, args].join(' ');
}

/**
 * compile eot font from ttf
 * @param  {Object} file    compile file object
 * @param  {Object} emitter  compile event emitter
 */
FontGenerator.prototype.compileEotFont = function(file, emitter) {
    var self = this,
        fs = require('fs'),
        ttf2eot = require('ttf2eot'),
        ext = self.utils.getFileExtension(file.name.toString()),
        input, ttf, eot, ext, source;

    var triggerError = function (message) {
        emitter.emit('fail');
        emitter.emit('always');
        self.throwError(message, file.src);
    };
    var triggerSuccess = function () {
        emitter.emit('done');
        emitter.emit('always');
    }

    try {
        ext !== 'ttf' ? source = file.src.slice(0, -ext.length) + 'ttf' : source = file.src;
        input = fs.readFileSync(source);
    } catch(e) {
        return triggerError(e);
    }

    try {
        ttf = new Uint8Array(input);
        eot = new Buffer(ttf2eot(ttf).buffer);
    } catch (e) {
        return triggerError(e);
    }

    fs.writeFile(path.join(file.output, file.name.slice(0, -ext.length) + 'eot'), eot, function(err) {
        if (err) {
            return triggerError(err);
        }
        triggerSuccess();
    });
}

/**
 * exec for fontforge
 * @param  {String} command    command string
 * @param {Function} callback   callback function
 */
FontGenerator.prototype.execProcess = function(command, callback){
    var exec = require('child_process').exec;
    var proc = exec(command, { timeout: 5000, maxBuffer: 2000*1024 }, function(err, stdout, stderr) {
        callback(err, stdout, stderr);
    });
}