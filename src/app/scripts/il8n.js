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
	var jsonPath, content;

	if (/en_us|zh_cn|ja_jp/.test(locales)) {
		jsonPath = global.appRootPth + '/locales/' + locales + '/context.json';
	} else {
		jsonPath = appConfig.userDataFolder + '/locales/' + locales + '/context.json';
		if (!fs.existsSync(jsonPath)) {
			jsonPath = global.appRootPth + '/locales/en_us/context.json';
		}
	}
	content = fs.readFileSync(jsonPath, 'utf8');
	content = util.replaceJsonComments(content);

	sessionStorage.setItem('localesContent', content);
})();


/**
 * get message of current language
 * @param  {String} id message id
 * @return {String}    message
 */
exports.__ = function (id) {
	var message = '';
	
	try {
		message = JSON.parse(sessionStorage.getItem('localesContent'))[id] || id;	
	} catch (e) {}
	

	if (message && arguments.length) {
		for (var i = 1; i < arguments.length; i++) {
			message = message.replace('${' + i + '}', arguments[i]);
		}
	}

	return message;
};


