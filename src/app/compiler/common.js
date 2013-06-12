/**
 * compile common function
 */

'use strict';

var path = require('path'),
	fs   = require('fs');

/**
 * get @import files
 * @param  {String} lang
 * @param  {String} srcFile
 * @return {Object}
 */
exports.getImports = function (lang, srcFile) {
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
		if (fs.existsSync(file)) fullPathImports.push(file);
	});

	// global.debug(imports)
	// global.debug(fullPathImports)

	return fullPathImports;
}