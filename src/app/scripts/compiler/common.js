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
}