/**
 * locales message services
 */

'use strict';

var fs             = require('fs'),
    util           = require('./util.js'),
    appConfig      = require('./appConfigManager.js').getAppConfig(),
    locales        = appConfig.locales,
    localStorage   = global.localStorage;

/**
 * get message of current language
 * @param  {String} id message id
 * @return {String}    message
 */
exports.__ = function (id) {
    var message = '',
        data = util.parseJSON(localStorage.getItem('localesContent')) || {},
        defaultData = {};

    // get default data if the locales pack not is built-in pack
    if (appConfig.builtInLanguages.indexOf(locales) === -1) {
        defaultData = util.parseJSON(localStorage.getItem('defaultLocalesContent')) || {};
    }

    message = data[id] || defaultData[id] || id;
    if (message && arguments.length) {
        for (var i = 1; i < arguments.length; i++) {
            message = message.replace('${' + i + '}', arguments[i]);
        }
    }

    return message;
};


