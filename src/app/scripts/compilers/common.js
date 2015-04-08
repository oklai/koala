/*
    Compiler common function
 */

var fs = require('fs'),
    path = require('path'),
    fileWatcher = require('../fileWatcher.js');

/**
 * get LESS/Sass @import files
 * @param  {String} lang
 * @param  {String} srcFile
 * @return {Object}
 */
function getOrWatchStyleImports (lang, srcFile, deepWatch, deepLevel) {
    //match imports from code
    var result = [],
        code = fs.readFileSync(srcFile, 'utf8');

    code = code.replace(/\/\/.+?[\r\t\n]/g, '').replace(/\/\*[\s\S]+?\*\//g, '');

    var imports = code.match(/@import.+?[\"\'](.+?)[\"\']/g) || [];

    if (imports.length === 0) return [];

    var matchs;
    imports.forEach(function (item, index) {
        matchs = item.match(/.+?[\"\'](.+?)[\"\']/) || [];
        item = matchs[1];

        if (!item) return false;

        if (/.less|.sass|.scss/.test(path.extname(item)) || path.extname(item) === '') {
            result.push(item);
        }
    });

    //get fullpath of imports
    var dirname = path.dirname(srcFile),
        extname = path.extname(srcFile),
        fullPathImports = [];

    result.forEach(function (item) {
        if (path.extname(item) !== extname) {
            item += extname;
        }
        var file = path.resolve(dirname, item);

        // the '_' is omittable sass imported file
        if (lang === 'sass' && path.basename(item).indexOf('_') === -1) {
            var temPath = path.resolve(path.dirname(file), '_' + path.basename(item));
            if (fs.existsSync(temPath)) {
                file = temPath;
            }
        }

        if (fs.existsSync(file)) fullPathImports.push(file);
    });

    if (deepWatch && deepLevel <= 5) {

        fileWatcher.addImports(fullPathImports, srcFile);

        deepLevel ++;

        fullPathImports.forEach(function (item) {
            exports.getStyleImports(lang, item, deepWatch, deepLevel);
        });
        return false;
    }

    return fullPathImports;
}

exports.getStyleImports = getOrWatchStyleImports;

exports.watchImports = function (lang, srcFile) {
    getOrWatchStyleImports(lang, srcFile, true, 1);
};


/**
 * auto add vendor prefixes
 * @param  {object} file object
 */
exports.autoprefix = function (file, config) {
    var cssFile = file.output,
        css = fs.readFileSync(cssFile),
        autoprefixer = require('autoprefixer');

    config = config || exports.autoprefixerDefault;

    css = autoprefixer(config).process(css).css;

    if (file.settings.sourceMap) {
        css = css + '\n/*# sourceMappingURL=' + path.basename(cssFile) + '.map */';
    }

    fs.writeFileSync(cssFile, css);
};

exports.autoprefixerDefault = ['> 1%', 'last 2 versions', 'Firefox ESR', 'Opera 12.1'];

exports.getAutoprefixConfig = function(scope, autoprefixConfig) {
    var customBrowsers = {};
    customBrowsers.browsers = [];

    if (typeof autoprefixConfig !== 'object') {
        // If a string is passed through, remove all commas and send to array
        autoprefixConfig = autoprefixConfig.split(',');
    }

    customBrowsers.browsers = autoprefixConfig;

    for (var i = 0; i < customBrowsers.browsers.length; i++) {
        // Here we remove all trailing space + remove all quotes so that it can be correctly parsed
        customBrowsers.browsers[i] = customBrowsers.browsers[i].trim().replace(/['"]+/g, '');
    }

    // Return the browsers object with the browser array for Autoprefix to consume
    return customBrowsers;
};
