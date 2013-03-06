/**
 * locales message services
 */

'use strict';

var fs             = require('fs'),
	util         = require('./util.js'),
	locales        = require('./appConfig.js').getAppConfig().locales,
	sessionStorage = global.mainWindow.window.sessionStorage;

//cache notification content
(function () {
	var content = fs.readFileSync(process.cwd() + '/locales/' + locales + '.json', 'utf8');
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
		message = JSON.parse(sessionStorage.getItem('localesContent'))[id] || '';	
	} catch (e) {}
	

	if (message && arguments.length) {
		for (var i = 1; i < arguments.length; i++) {
			message = message.replace('${' + i + '}', arguments[i]);
		}
	}

	return message;
};


