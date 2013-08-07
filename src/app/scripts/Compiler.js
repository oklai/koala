/**
 * Compiler Class
 */

'use strict';

var util        = require('./util.js'),
	FileManager = require('./FileManager.js');

/**
 * Compile Class
 * @param {object} config compiler config
 */
function Compiler (config) {
	for (var k in config) {
		switch (k) {
			case "display":
				this.display = config.display || config.name;
				break;

			default:
				this[k] = config[k];
		}
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
	return util.clone(require(FileManager.appScriptsDir + '/appConfigManager.js').getGlobalSettingsOfCompiler(compileName || this.name));
};

/**
 * Get App Config
 * @return {object} app config
 */
Compiler.prototype.getAppConfig = function () {
	return util.clone(require(FileManager.appScriptsDir + '/appConfigManager.js').getAppConfig());
};

/**
 * Get Project Data By Project ID
 * @param  {string} pid project id
 * @return {object}     project data
 */
Compiler.prototype.getProjectById= function (pid) {
	var projectDb = require(FileManager.appScriptsDir + '/storage.js').getProjects();
	return util.clone(projectDb[pid]);
};

