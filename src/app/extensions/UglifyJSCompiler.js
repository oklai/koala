/**
 * UglifyJS compiler
 */

'use strict';

var fs          = require('fs'),
    path        = require('path'),
    FileManager = global.getFileManager(),
    Compiler    = require(FileManager.appScriptsDir + '/Compiler'),
    fileWatcher = require(FileManager.appScriptsDir + '/fileWatcher.js');

function UglifyJSCompiler(config) {
    Compiler.apply(this, arguments);
}
require('util').inherits(UglifyJSCompiler, Compiler);
module.exports = UglifyJSCompiler;

UglifyJSCompiler.prototype.compileFile = function (file, done) {
    // compile file with command
    var globalSettings = this.getGlobalSettings();
    if (globalSettings.advanced.useCommand) {
        this.compileFileWithCommand(file, done);
    } else {
        this.compileFileWithLib(file, done);
    }
};

UglifyJSCompiler.prototype.compileFileWithLib = function (file, done) {
    var UglifyJS = require('uglify-js'),
        options = file.settings,
        abort = false, index, numberOfRemainingFiles,
        files;

    files = this._getImports(file.src);
    files = files.prepend.concat(file.src, files.append);
    numberOfRemainingFiles = files.length;

    var minify = function () {
        try {
            // write output
            fs.writeFile(file.output, UglifyJS.minify(files, {fromString: true}).code, "utf8", function (err) {
                if (err) {
                    return done(err);
                }

                done();

                fileWatcher.addImports(this.getImports(file.src), file.src);
            }.bind(this));
        } catch (err) {
            done(err);
        }
    }.bind(this);

    // read code
    for (index = 0; index < files.length && !abort; index++) {
        fs.readFile(files[index], "utf8", function (err, code) {
            if (err) {
                abort = true;
                return done(err);
            }

            files[this] = code;
            numberOfRemainingFiles--;
            if (numberOfRemainingFiles === 0) {
                minify();
            }
        }.bind(index));
    }
};

/**
 * compile file with system command
 * @param  {Object} file file object to compiler
 * @param  {Object} done done callback
 */
UglifyJSCompiler.prototype.compileFileWithCommand = function (file, done) {
    var exec         = require('child_process').exec,
        filePath     = file.src,
        output       = file.output,
        compressOpts = {},
        imports      = this._getImports(filePath),
        files        = imports.prepend.concat('"' + filePath + '"', imports.append),
        argv;


    argv = files.map(function (importedFilePath) {
        return '"' + importedFilePath + '"';
    });
    argv.push('-o "' + output + '"');

    exec([this.getCommandPath('uglifyjs')].concat(argv).join(' '), {timeout: 5000}, function (err) {
        done(err);
        if (!err) {
            fileWatcher.addImports(this.getImports(filePath), filePath);
        }
    }.bind(this));
};

UglifyJSCompiler.prototype.getImports = function (srcFile) {
    var imports = this._getImports(srcFile);
    return imports.prepend.concat(imports.append);
};

UglifyJSCompiler.prototype._getImports = function (srcFile) {
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
