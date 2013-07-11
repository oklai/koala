/**
 * render page with locales language
 */

'use strict';

var fs         = require('fs-extra'),
	path       = require('path'),
	appConfig  = require('./appConfig.js').getAppConfig(),
	util       = require('./util.js'),
	locales    = appConfig.locales;


var templateDir = global.appRootPth + '/views/template',
	cacheDir = global.appRootPth + '/views/release';
	
var languagePack,
	defaultLanguagePack = global.appRootPth + '/locales/en_us/views.json',
	useInstalledPack;

// Built-in language packs 
if (appConfig.builtInLanguages.join().indexOf(locales) > -1) {

	languagePack = global.appRootPth + '/locales/' + locales + '/views.json';

} else {

	// Installed language packs
	languagePack = appConfig.userDataFolder + '/locales/' + locales + '/views.json';

	if (!fs.existsSync(languagePack)) {
		languagePack = defaultLanguagePack;
	} else {
		useInstalledPack = true;
	}
}

// get template pages
var getTemplates = function () {
	var templates = [];

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
				templates.push(dir + path.sep + item);
			}
		}
	}

	walk(templateDir);

	return templates;
}

// render page
var render = function () {
	var templates = getTemplates(),
		data = util.readJsonSync(languagePack) || {},
		defaultData = {};

	if (useInstalledPack) {
		defaultData = util.readJsonSync(defaultLanguagePack);
	}

	templates.forEach(function (item) {
		var html = fs.readFileSync(item, 'utf8'),
			fields = html.match(/\{\{(.*?)\}\}/g),
			dest = item.replace(templateDir, cacheDir);

		var key, val;
		fields.forEach(function (item) {
			key = item.slice(2, -2);
			val = data[key] || defaultData[key] || key.replace(/\[\@(.*?)\]/, '');
			html = html.replace(item, val);
		});

		fs.outputFileSync(dest, html);
	});
}
render();