/**
 * language services
 */

var fs = require('fs'),
	lang = require('./appConfig.js').getAppConfig().language,
	sessionStorage = global.mainWindow.window.sessionStorage;

//cache notification content
sessionStorage.setItem('languageContent', fs.readFileSync(process.cwd() + '/languages/' + lang + '.lang', 'utf8'));

/**
 * get message of current language
 * @param  {String} id message id
 * @return {String}    message
 */
exports.getMessage = function (id) {
	var message = JSON.parse(sessionStorage.getItem('languageContent'))[id];

	if (arguments.length) {
		for (var i = 1; i < arguments.length; i++) {
			message = message.replace('${' + i + '}', arguments[i]);
		}
	}

	return message;
};


