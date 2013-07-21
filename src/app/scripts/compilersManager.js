/**
 * compilers manager module
 */

'use strict';

var fs                   = require('fs-extra'),
    path                 = require('path'),
    util                 = require('./util'),
    Compiler             = require('./Compiler'),
    FileManager          = global.getFileManager(),
    compilers            = {};

exports.loadCompiler = function (compilerConfigPath) {
    return exports.addCompilerWithConfig(util.readJsonSync(compilerConfigPath), path.dirname(compilerConfigPath));
};

exports.addCompilerWithConfig = function (compilerConfig, dir) {
    var CompilerClass, compiler;
    if (!compilerConfig) {
        return null;
    }

    CompilerClass = require(path.join(dir, compilerConfig.class_path));
    // compiler = new CompilerClass(compilerConfig, dir);
    // compilers[compiler.name] = compiler;

    return compiler;
};

/**
 * get compilers
 * @return {Array} compilers
 */
exports.getCompilers = function () {
    return compilers;
};

/**
 * get compiler for the given file type, or null if not found.
 * @param  {String} fileType file type name.
 * @return {Object} compiler for the fileType, or null.
 */
exports.compilerForFileType = function (fileType) {
    var compilerName;
    for (compilerName in compilers) {
        if (compilers[compilerName].fileTypeNames.indexOf(fileType) !== -1) {
            return compilers[compilerName];
        }
    }

    return null;
};

/**
 * get default config
 * @return {Object} default config
 */
exports.getDefaultConfig = function () {
    var config = {useSystemCommand: {} },
        compilerName,
        compiler;
    for (compilerName in compilers) {
        compiler = compilers[compilerName];

        if (util.isEmpty(compiler.defaults)) {
            return;
        }

        config[compiler.name] = {};
        if (compiler.defaults.options) {
            for (var key in compiler.defaults.options) {
                config[compiler.name][key] = compiler.defaults.options[key];
            }
        }
        if (compiler.defaults.outputStyle !== undefined) {
            config[compiler.name].outputStyle = compiler.defaults.outputStyle;
        }
        config.useSystemCommand[compiler.name] = !!compiler.defaults.useSystemCommand;
    }
    return config;
};

/**
 * run compile
 * @param  {Object} file    compile file object
 * @param  {Function} success compile success calback
 * @param  {Function} fail    compile fail callback
 */
exports.compileFile = function (file, success, fail) {
    var output_dir = path.dirname(file.output);

    //create output dir if it's not exists
    if (!fs.existsSync(output_dir)) {
        fs.mkdirpSync(output_dir);
    }

    exports.compilerForFileType(file.type).compile(file, success, fail);
};
