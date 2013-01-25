/**
 * locales message services
 */

var fs             = require('fs'),
	locales        = require('./appConfig.js').getAppConfig().locales,
	sessionStorage = global.mainWindow.window.sessionStorage;

//cache notification content
sessionStorage.setItem('localesContent', fs.readFileSync(process.cwd() + '/locales/' + locales + '.json', 'utf8'));

/**
 * get message of current language
 * @param  {String} id message id
 * @return {String}    message
 */
exports.__ = function (id) {
	var message = JSON.parse(sessionStorage.getItem('localesContent'))[id];

	if (arguments.length) {
		for (var i = 1; i < arguments.length; i++) {
			message = message.replace('${' + i + '}', arguments[i]);
		}
	}

	return message;
};


