/**
 * render page with locales language
 */

'use strict';

var fs             = require('fs-extra'),
    path           = require('path'),
    appConfig      = require('./appConfig.js').getAppConfig(),
    util           = require('./util.js'),
    locales        = appConfig.locales,
    sessionStorage = mainWindow.window.sessionStorage;

// get template pages
var getTemplates = function (dir) {
    var templates = [];

    function walk(root) {
        var dirList = fs.readdirSync(root);

        for (var i = 0; i < dirList.length; i++) {
            var item = dirList[i];

            if(fs.statSync(root + path.sep + item).isDirectory()) {
                try {
                    walk(root + path.sep + item);
                } catch (e) {

                }

            } else {
                templates.push(root + path.sep + item);
            }
        }
    }

    walk(dir);

    return templates;
}

// compare between current locales with last locales
var compare = function (localesPackage) {
    var current = util.readJsonSync(localesPackage) || {},
        last = util.parseJSON(sessionStorage.getItem('lastLocalesPackage')) || {};
    return current.language_code === last.language_code && current.app_version === last.app_version;
}

//render context json
var renderContext = function (useExpandPack) {
    var contextJson,
        content;

    if (useExpandPack) {
        contextJson = appConfig.userDataFolder + '/locales/' + locales + '/context.json';
    } else {
        contextJson = global.appRootPth + '/locales/' + locales + '/context.json';
    }

    content = fs.readFileSync(contextJson, 'utf8');
    content = util.replaceJsonComments(content);
    sessionStorage.setItem('localesContent', content);

    // load default language pack
    if (useExpandPack) {
        content = fs.readFileSync(global.appRootPth + '/locales/en_us/context.json', 'utf8');
        content = util.replaceJsonComments(content);
        sessionStorage.setItem('defaultLocalesContent', content);
    }
}


var renderViews = function (viewsJson, useExpandPack) {
    // translate templates
    var templateDir = global.appRootPth + '/views/template',
        templates = getTemplates(templateDir),
        data = util.readJsonSync(viewsJson) || {},
        defaultData = {};

    if (useExpandPack) {
        defaultData = util.readJsonSync(global.appRootPth + '/locales/en_us/views.json');
    }

    templates.forEach(function (item) {
        var content = fs.readFileSync(item, 'utf8'),
            fields = content.match(/\{\{(.*?)\}\}/g)

        if (fields) {
            var key, val;
            fields.forEach(function (item) {
                key = item.slice(2, -2);
                val = data[key] || defaultData[key] || key.replace(/\[\@(.*?)\]/, '');
                content = content.replace(item, val);
            });
        }

        // Save to sessionStorage
        var sessionName = item.split(/[\\|\/]template/).pop().replace(/\\|\//g, '-').replace(/\.html|\.jade/, '');
        if (path.extname(item) === '.jade') {
            sessionName = 'jade' + sessionName;

            // Save  jade file path
            sessionStorage.setItem('fileNameOf-' + sessionName, item);
        } else {
            sessionName = 'views' + sessionName;
        }

        sessionStorage.setItem(sessionName, content);
    });
}

// render views and context
var renderInit = function () {
    var viewsJson, useExpandPack, localesPackage;

    // Built-in language packs
    if (appConfig.builtInLanguages.indexOf(locales) > -1) {
        viewsJson = global.appRootPth + '/locales/' + locales + '/views.json';
    } else {
        // Installed language packs
        viewsJson = appConfig.userDataFolder + '/locales/' + locales + '/views.json';

        if (!fs.existsSync(viewsJson)) {
            viewsJson = global.appRootPth + '/locales/en_us/views.json';
        } else {
            useExpandPack = true;
        }
    }

    // locales package
    if (useExpandPack) {
        localesPackage = appConfig.userDataFolder + '/locales/' + locales + '/package.json';
    } else {
        localesPackage = global.appRootPth + '/locales/' + locales + '/package.json';
    }

    // Don't need retranslate when current locales is the some as last locales
    if (!compare(localesPackage)) {
        // Render views
        renderViews(viewsJson, useExpandPack);

        // Render context
        renderContext(useExpandPack);

        // Save current locales package
        sessionStorage.setItem('lastLocalesPackage', fs.readFileSync(localesPackage, 'utf8'));
    }
}


// init
renderInit();