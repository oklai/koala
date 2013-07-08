/**
 * locales message services
 */

'use strict';

var fs             = require('fs'),
	util           = require('./util.js'),
	appConfig      = require('./appConfig.js').getAppConfig(),
	locales        = appConfig.locales,
	sessionStorage = global.mainWindow.window.sessionStorage;

//cache notification content
(function () {
	var languagePack,
		content,
		useInstalledPack;

	if (appConfig.builtInLanguages.join().indexOf(locales)  > -1) {
		languagePack = global.appRootPth + '/locales/' + locales + '/context.json';
	} else {
		languagePack = appConfig.userDataFolder + '/locales/' + locales + '/context.json';
		if (!fs.existsSync(languagePack)) {
			languagePack = global.appRootPth + '/locales/en_us/context.json';
		} else {
			useInstalledPack = true;
		}
	}

	content = fs.readFileSync(languagePack, 'utf8');
	content = util.replaceJsonComments(content);
	sessionStorage.setItem('localesContent', content);

	// load default language pack
	if (useInstalledPack) {
		content = fs.readFileSync(global.appRootPth + '/locales/en_us/context.json', 'utf8');
		content = util.replaceJsonComments(content);
		sessionStorage.setItem('defaultLocalesContent', content);
	}
})();


/**
 * get message of current language
 * @param  {String} id message id
 * @return {String}    message
 */
exports.__ = function (id) {
	var message = '',
		data = util.parseJSON(sessionStorage.getItem('localesContent')) || {},
		defaultData = {};
	
	if (!/en_us|zh_cn|ja_jp/.test(locales)) {
		defaultData = util.parseJSON(sessionStorage.getItem('defaultLocalesContent')); 
	}

	message = data[id] || defaultData[id] || id;
	if (message && arguments.length) {
		for (var i = 1; i < arguments.length; i++) {
			message = message.replace('${' + i + '}', arguments[i]);
		}
	}

	return message;
};


