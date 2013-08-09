/**
 * Compiler Class
 */

'use strict';

var util          = require('./util.js'),
	storage       = require('./storage.js'),
	configManager = require('./appConfigManager.js'),
	notifier      = require('./notifier.js'),
	fileWatcher   = require('./fileWatcher.js'),
	FileManager   = require('./FileManager.js');

/**
 * Compile Class
 * @param {object} config compiler config
 */
function Compiler (config) {
	for (var k in config) {
		this[k] = config[k];
	}
}

module.exports = Compiler;

/**
 * Compile Method
 * @param  {object} file     file object
 * @param  {Object} handlers  compile event handlers
 */
Compiler.prototype.compile = function(file, handlers) {
	// this method will be overwritten
};

/**
 * Get Global Settings Of Compile
 * @param  {string} compileName compiler name
 * @return {object}             settings
 */
Compiler.prototype.getGlobalSettings = function(compileName) {
	return util.clone(configManager.getGlobalSettingsOfCompiler(compileName || this.name));
};

/**
 * Get App Config
 * @return {object} app config
 */
Compiler.prototype.getAppConfig = function () {
	return util.clone(configManager.getAppConfig());
};

/**
 * Get Project Data By Project ID
 * @param  {string} pid project id
 * @return {object}     project data
 */
Compiler.prototype.getProjectById= function (pid) {
	return util.clone(storage.getProjects()[pid]);
};

/**
 * throw error message
 * @param  {string} message  error message
 * @param  {string} filePath file path
 */
Compiler.prototype.throwError = function(message, filePath) {
	notifier.throwError(message, filePath);
};

/**
 * watch import files
 * @param  {array} imports    import array
 * @param  {string} sourceFile sourcr file
 */
Compiler.prototype.watchImports = function (imports, sourceFile) {
	fileWatcher.addImports(imports, sourceFile);
}