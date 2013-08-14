/**
 * UglifyJS compiler
 */

'use strict';

var fs          = require('fs'),
    path        = require('path'),
    FileManager = global.getFileManager(),
    Compiler    = require(FileManager.appScriptsDir + '/Compiler.js');

function UglifyJSCompiler(config) {
    Compiler.apply(this, arguments);
}
require('util').inherits(UglifyJSCompiler, Compiler);
module.exports = UglifyJSCompiler;

var _getImports = function (srcFile) {
    //match imports from code
    var reg = /@koala-(prepend|append)\s+["']([^.]+?|.+?js)["']/g,
        result, type, importPath,

        //get fullpath of imports
        dirname = path.dirname(srcFile),
        fullPathImports = {prepend: [], append: []},

        code = fs.readFileSync(srcFile, 'utf8');

    while ((result = reg.exec(code)) !== null) {
        type = result[1];
        importPath = result[2];
        if (path.extname(importPath) !== '.js') {
            importPath += '.js';
        }

        importPath = path.resolve(dirname, importPath);

        if (fs.existsSync(importPath)) {
            fullPathImports[type].push(importPath);
        }
    }

    return fullPathImports;
};

var getCombinedFile = function (filePath, importedFiles) {
    if (typeof importedFiles === "undefined") {
        importedFiles = [];
    }

    if (importedFiles.indexOf(filePath) !== -1) {
        return [];
    }
    var prepend = [],
        append  = [],
        files   = _getImports(filePath);

    importedFiles.push(filePath);

    files.prepend.forEach(function (importedFilePath) {
        if (importedFiles.indexOf(importedFilePath) === -1) {
            prepend.push.apply(prepend, getCombinedFile(importedFilePath, importedFiles));
        }
    });

    files.append.forEach(function (importedFilePath) {
        if (importedFiles.indexOf(importedFilePath) === -1) {
            append.push.apply(append, getCombinedFile(importedFilePath, importedFiles));
        }
    });

    return prepend.concat(filePath, append);
};

/**
 * compile js file
 * @param  {Object} file      compile file object
 * @param  {Object} emitter  compile event emitter
 */
UglifyJSCompiler.prototype.compile = function (file, emitter) {
    //compile file by use system command
    var globalSettings = this.getGlobalSettings();
    this.compileWithLib(file, emitter);
}

/**
 * compile js file with node lib
 * @param  {Object} file      compile file object
 * @param  {Object} handlers  compile event handlers
 */
UglifyJSCompiler.prototype.compileWithLib = function (file, emitter) {
    var files = getCombinedFile(file.src),

        triggerError = function (message) {
            emitter.emit('fail');
            emitter.emit('always');

            this.throwError(message, file.src);
        }.bind(this),
        
        minify = function () {
            var UglifyJS = require('uglify-js'),
                options  = file.settings;
            try {
                // write output
                fs.writeFile(file.output, UglifyJS.minify(files, {fromString: true}).code, "utf8", function (err) {
                    if (err) {
                        triggerError(err.message);
                    } else {
                        emitter.emit('done');
                        emitter.emit('always');
                        this.watchImports(this.getImports(file.src), file.src);
                    }
                }.bind(this));
            } catch (err) {
                triggerError(err.message);
            }
        }.bind(this),

        abort = false,
        numberOfRemainingFiles = files.length,
        gotCode = function (err, code) {
            if (err) {
                abort = true;
                return triggerError(err.message);
            }

            files[this] = code;
            numberOfRemainingFiles--;
            if (numberOfRemainingFiles === 0) {
                minify();
            }
        },

        index;

    // read code
    for (index = 0; index < files.length && !abort; index++) {
        fs.readFile(files[index], "utf8", gotCode.bind(index));
    }
};

UglifyJSCompiler.prototype.getImports = function (srcFile) {
    var imports = _getImports(srcFile);
    return imports.prepend.concat(imports.append);
};
