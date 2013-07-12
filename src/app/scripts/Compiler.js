/**
 * Compiler module
 */

'use strict';

var path             = require('path'),
	fs               = require('fs'),
	fileTypesManager = require('./fileTypesManager'),
	util             = require('./util');

/**
 * Create a compiler from the config.
 * @param {Object} config the configuration to use to create the compiler.
 */
function Compiler(config) {
	this.name = config.name;
	this.version = config.version;
	this.fileTypeNames = util.asArray(config.fileTypes);
	this.outputExtensions = config.output_extensions;

	this.options = util.asArray(config.options);
	this.outputStyle = util.asArray(config.outputStyle);

	this.display = {};
	this.display.name = config.display.name;
	this.display.options = util.asArray(config.display.options);
	this.display.outputStyle = util.asArray(config.display.outputStyle);

	this.defaults = config.defaults || {};

	this.fileTypes = [];

	var fileTypes = fileTypesManager.getFileTypes(),
		fileTypeName;
	for (fileTypeName in fileTypes) {
		if (this.fileTypeNames.indexOf(fileTypeName) !== -1) {
			this.fileTypes.push(fileTypes[fileTypeName]);
		}
	}
}

module.exports = Compiler;

Compiler.prototype.accepts = function (fileExt) {
	return this.fileTypes.some(function (fileType) {
		return fileType.extensions.indexOf(fileExt) !== -1;
	});
};

Compiler.prototype.getDisplay = function (propertyPath) {
	var props = propertyPath.split('.'),
		i, value;

	for (i = 0, value = this.display; i < props.length && value; i++) {
		value = value[props[i]];
	}
	if (!value) {
		for (i = 0, value = this; i < props.length && value; i++) {
			value = value[props[i]];
		}
	}

	return value;
};

Compiler.prototype.hasOptions = function () {
	return !util.isEmpty(this.options);
};

Compiler.prototype.hasOutputStyle = function () {
	return !util.isEmpty(this.outputStyle);
};

Compiler.prototype.getOutputExtensionForInputExtension = function (ext) {
	if (typeof this.outputExtensions === "object") {
		return this.outputExtensions[ext];
	}
	return this.outputExtensions;
};

Compiler.prototype.getImports = function (lang, srcFile) {
	//match imports from code
	var reg,
		result,
		imports = [];

	var code = fs.readFileSync(srcFile, 'utf8');
		code = code.replace(/\/\/.+?[\r\t\n]/g, '').replace(/\/\*[\s\S]+?\*\//g, '');

	if (lang === 'less') reg = /@import\s+[\"\']([^\.]+?|.+?less)[\"\']/g;

	if (lang === 'sass') reg = /@import\s+[\"\']([^\.]+?|.+?sass|.+?scss)[\"\']/g;

	while ((result = reg.exec(code)) !== null ) {
	  imports.push(result[1]);
	}

	//get fullpath of imports
	var dirname = path.dirname(srcFile),
		extname = path.extname(srcFile),
		fullPathImports = [];
	
	imports.forEach(function (item) {
		if (path.extname(item) !== extname) {
			item += extname;
		}

		var file = path.resolve(dirname, item);

		// the '_' is omittable sass imported file 
		if (lang === 'sass' && path.basename(item).indexOf('_') === -1) {
			var item2 = '_' + path.basename(item);
			var file2 = path.resolve(path.dirname(file), item2);
			if (fs.existsSync(file2)) {
				fullPathImports.push(file2);
				return false;
			}
		}

		if (fs.existsSync(file)) {
			fullPathImports.push(file);
		}
	});

	return fullPathImports;
};

Compiler.prototype.toJSON = function () {
	var json = {};

	json.name = this.name;
	json.version = this.version;
	json.fileTypes = this.fileTypeNames;
	json.output_extensions = this.outputExtensions;

	if (!util.isEmpty(json.options)) {
		json.options = this.options;
	}
	if (!util.isEmpty(json.outputStyle)) {
		json.outputStyle = this.outputStyle;
	}

	if (!util.isEmpty(json.display)) {
		json.display = {};
		if (this.display.name) {
			json.display.name = this.display.name;
		}
		if (this.display.options) {
			json.display.options = this.display.options;
		}
		if (this.display.outputStyle) {
			json.display.outputStyle = this.display.outputStyle;
		}
	}

	if (!util.isEmpty(this.defaults)) {
		json.defaults = this.defaults;
	}
};
