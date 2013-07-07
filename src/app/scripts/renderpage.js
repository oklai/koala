/**
 * render page with locales language
 */

'use strict';

var fs         = require('fs-extra'),
	path       = require('path'),
	appConfig  = require('./appConfig.js').getAppConfig(),
	util       = require('./util.js'),
	locales    = appConfig.locales || 'en_us';


var templateDir = process.cwd() + '/html/template',
	cacheDir = process.cwd() + '/html/release';
	
var languegePack;
if (/en_us|zh_cn|ja_jp/.test(locales)) {
	languegePack = process.cwd() + '/html/languages/' + locales + '.json';
} else {
	languegePack = appConfig.userDataFolder + '/languages/' + locales + '.json';
}
console.log(languegePack)

// get template pages
var getPages = function (dir) {
	var pages = [];

	function walk(dir) {
		var dirList = fs.readdirSync(dir);

		for (var i = 0; i < dirList.length; i++) {
			var item = dirList[i];

			if(fs.statSync(dir + path.sep + item).isDirectory()) {
				try {
					walk(dir + path.sep + item);
				} catch (e) {

				}
				
			} else {
				pages.push(dir + path.sep + item);
			}
		}
	}

	walk(dir);

	return pages;
}

// load locales language data
var loadData = function (jsonPath) {
	var content = '';

	if (fs.existsSync(jsonPath)) {
		content = fs.readFileSync(jsonPath, 'utf8');
	}

	content = util.replaceJsonComments(content);

	try {
		return JSON.parse(content);
	} catch (e) {
		return {};
	}
};

// render page
var render = function (pages, data) {
	pages.forEach(function (item) {
		var html = fs.readFileSync(item, 'utf8'),
			fields = html.match(/\{\{(.*?)\}\}/g),
			dest = item.replace(templateDir, cacheDir);

		if (fields) {
			var key, val;
			fields.forEach(function (item) {
				key = item.slice(2, -2);

				if (data[key]) {
					val = data[key];
				} else {
					//e.g [@settings.html]Version -> Version
					val = key.replace(/\[\@(.*?)\]/, '');
				}

				html = html.replace(item, val);
			});
		}

		fs.outputFileSync(dest, html);
	});
}
render(getPages(templateDir), loadData(languegePack));