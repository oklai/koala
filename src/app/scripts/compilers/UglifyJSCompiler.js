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

UglifyJSCompiler.prototype.createError = function (importFile, parentFile, includePaths) {
    var errorMessage = 'Syntax error: File to append not found or unreadable: {{importFile}}.\nLoad paths:\n\t {{paths}}\n on {{parentFile}}';

    errorMessage = errorMessage.replace('{{importFile}}', importFile)
                .replace('{{parentFile}}', parentFile)
                .replace('{{paths}}', includePaths.join('\n\t'));

    return new Error(errorMessage);
}

UglifyJSCompiler.prototype.getImports = function (srcFile) {
    //match imports from code
    var reg = /@(?:koala|codekit|prepros)-(prepend|append)\s+(.*)/g,
        regFile = /["']([^.]+?|.+?js)["']/g,
        result, type, files,

        //get fullpath of imports
        dirnames = [path.dirname(srcFile)].concat(this.includePaths),
        fullPathImports = {prepend: [], append: []},
        fullimportPath,
        isExists,
        code = fs.readFileSync(srcFile, 'utf8');

    try {
        while ((result = reg.exec(code)) !== null) {
            type = result[1];
            files = result[2].split(',');
            files.forEach(function (file) {
                var result, importPath;

                regFile.lastIndex = 0;
                result = regFile.exec(file);
                if (!result) return;

                importPath = result[1];
                if (path.extname(importPath) !== '.js') {
                    importPath += '.js';
                }

                isExists = false;
                for (var i = 0; i < dirnames.length; i++) {
                    fullimportPath = path.resolve(dirnames[i], importPath);
                    if (fs.existsSync(fullimportPath)) {
                        fullPathImports[type].push(fullimportPath);
                        isExists = true;
                        break;
                    }
                }

                // import file not found, throw error
                if (!isExists) {
                    var error = this.createError(importPath, srcFile, dirnames);
                    throw error;
                }
            }.bind(this));
        }
    } catch (e) {
        throw e;
    }

    return fullPathImports;
};

UglifyJSCompiler.prototype.getCombinedFile = function (filePath) {
    var _this = this;

    if (this.importedFiles.indexOf(filePath) !== -1) {
        return [];
    }
    var prepend = [],
        append  = [],
        files = this.getImports(filePath);

    this.importedFiles.push(filePath);
    this.deepImports.push(files);

    files.prepend.forEach(function (importedFilePath) {
        if (_this.importedFiles.indexOf(importedFilePath) === -1) {
            prepend.push.apply(prepend, _this.getCombinedFile(importedFilePath));
        }
    });

    files.append.forEach(function (importedFilePath) {
        if (_this.importedFiles.indexOf(importedFilePath) === -1) {
            append.push.apply(append, _this.getCombinedFile(importedFilePath));
        }
    });

    return prepend.concat(filePath, append);
};

UglifyJSCompiler.prototype.getDeepImportedFiles = function () {
    var files = [];

    this.deepImports.forEach(function (item) {
        files = files.concat(item.append, item.prepend);

    });

    var files2 = [];

    files.forEach(function (item) {
        if (files2.indexOf(item) === -1) {
            files2.push(item);
        }
    });

    return files2;
}

/**
 * compile js file
 * @param  {Object} file      compile file object
 * @param  {Object} emitter  compile event emitter
 */
UglifyJSCompiler.prototype.compile = function (file, emitter) {
    //compile file by use system command
    this.compileWithLib(file, emitter);
}

/**
 * compile js file with node lib
 * @param  {Object} file      compile file object
 * @param  {Object} handlers  compile event handlers
 */
UglifyJSCompiler.prototype.compileWithLib = function (file, emitter) {
    var includePaths = this.getProjectById(file.pid).config.includePaths;
    if (!Array.isArray(includePaths)) {
        includePaths = [];
    }
    includePaths = includePaths.concat(this.getAppConfig().includePaths || []);

    this.file = file;
    this.includePaths = includePaths;
    this.importedFiles = [];
    this.deepImports = [];

    var triggerError = function (message) {
            emitter.emit('fail');
            emitter.emit('always');

            this.throwError(message, file.src);
        }.bind(this);

    var files;
    try {
        files = this.getCombinedFile(file.src);
    } catch (e) {
        triggerError(e.message);
        return false;
    }

    var minify = function () {
            var options  = file.settings;
            var code;
            try {
                if (options.compress) {
                    // more options see https://github.com/mishoo/UglifyJS2#api-reference
                    var UglifyJS = options.harmony ? require('uglify-es') : require('uglify-js');
                    var result = UglifyJS.minify(files, {
                        output: {
                            comments: options.comments ? new RegExp('@preserve|@license|@cc_on', 'i') : false
                        }
                    });

                    if (result.error) {
                        if (result.error.stack) {
                            triggerError(result.error.stack + '\nThis is probably a bug in UglifyJS.');
                        } else {
                            triggerError(result.error.message + '\n' + JSON.stringify(result.error.defs));
                        }
                        return;
                    }

                    code = result.code;
                } else {
                    code = files.join('\n\n');
                }
                // write output
                fs.writeFile(file.output, code, "utf8", function (err) {
                    if (err) {
                        triggerError(err.message);
                    } else {
                        this.watchImports(this.getDeepImportedFiles(), file.src);
                        emitter.emit('done');
                        emitter.emit('always');
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
