/**
 * My compiler
 */

'use strict';

var FileManager = global.getFileManager(),
    Compiler    = require(FileManager.appScriptsDir + '/Compiler.js');

/**
 * My Compiler
 * @param {object} config compiler config
 */
function MyCompiler(config) {
   Compiler.call(this, config);
}
require('util').inherits(MyCompiler, Compiler);

module.exports = MyCompiler;

/**
 * compile file
 * @param  {Object} file    compile file object
 * @param  {Object} emitter  compile event emitter
 */
MyCompiler.prototype.compile = function (file, emitter) {
    // TODO
}