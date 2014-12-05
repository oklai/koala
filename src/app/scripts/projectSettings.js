/*
    project settings
 */

"use strict";

var path           = require('path'),
    fs             = require('fs-extra'),
    exec           = require('child_process').exec,
    projectsDb     = require('./storage.js').getProjects(),
    appConfig      = require('./appConfigManager.js').getAppConfig(),
    projectManager = require('./projectManager.js'),
    compilersManager= require('./compilersManager.js'),
    util           = require('./util.js'),
    notifier       = require('./notifier.js'),
    il8n           = require('./il8n.js'),
    FileManager    = global.getFileManager(),
    $              = global.jQuery,
    gui            = global.gui;

/**
 * get project config file path
 * @param  {String}   name     compiler name
 * @param  {String}   target   project dir path
 * @return {String}   config file path
 */
exports.getConfigFilePath = function (name, target) {
    return path.join(target, name === 'compass' ? 'config.rb' : 'koala-config.json');
}

/**
 * create project config file
 * @param  {String}   name     compiler name
 * @param  {String}   target   project dir path
 * @param  {String}   pid      project id
 * @param  {Function} callback
 */
exports.create = function (name, target, pid, callback) {
    var dest = exports.getConfigFilePath(name, target);

    if (name === 'compass') {
        //for compass
        var command = 'ruby -S "' + path.join(FileManager.appBinDir, 'compass') + '" config config.rb';

        exec(command, {cwd: target, timeout: 5000}, function (error, stdout, stderr) {
            if (error !== null) {
                $.koalaui.alert(stderr || stdout);
            } else {
                watchSettingsFile(dest);
                if (callback) callback(dest);
            }
        });

    } else {
        //for other compilers
        var tmpl;
        if (name === 'default') {
            tmpl = path.join(FileManager.appSettingsDir, "koala-config-of-default.json");
        } else {
            tmpl = compilersManager.getCompilerByName(name).projectSettings;
        }

        fs.copy(tmpl, dest, function (err) {
            if (err) {
                $.koalaui.alert(err[0].message);
            } else {
                watchSettingsFile(dest);
                if (callback) callback(dest);
            }
        });
    }

    // reload current project
    reloadProject(pid);
}


/**
 * parse koala-config.json
 * @param  {String} configPath config file path
 * @return {Object}            project config
 */
exports.parseKoalaConfig = function (configPath) {
    var jsonStr = util.replaceJsonComments(fs.readFileSync(configPath, 'utf8')),
        data,
        config = {
            source: configPath,
            options: {},
            mappings: [],
            ignores: []
        };

    try {
        data = JSON.parse(jsonStr);
    } catch (err) {
        notifier.throwError('Parse Error:\n' + err.message, configPath);
        return null;
    }

    //get config
    for (var k in data) {
        if (/options|mappings|ignores/.test(k)) continue; //parse item at behind 

        if (/sass_dir|less_dir|coffee_dir/.test(k)) {
            config.inputDir = data[k];
            continue;
        }
        if (/css_dir|javascripts_dir/.test(k)) {
            config.outputDir = data[k];
            continue;
        }

        var _k =  formatKey(k);
        config[_k] = data[k];
    }

    //compiler options
    if (data.options) {
        for (var j in data.options) {
            var _j = formatKey(j);
            config.options[_j] = data.options[j];
        }
    }

    //get full http path and input, output dir
    var root = path.join(path.dirname(configPath), data.httpPath || '');

    // absolute mapping path
    if (data.mappings) {
        config.mappings = data.mappings.map(function (item) {
            if (item.src.lastIndexOf('/') === item.src.length - 1) {
                item.src = item.src.slice(0, -1)
            }
            if (item.dest.lastIndexOf('/') === item.dest.length - 1) {
                item.dest = item.dest.slice(0, -1)
            }
            item.src = path.join(root, item.src);
            item.dest = path.join(root, item.dest);
            return item;
        });
    }
    
     // add a mapping for old version koala-config
    if (config.inputDir && config.outputDir) {
        config.inputDir = path.join(root, config.inputDir);
        config.outputDir = path.join(root, config.outputDir);

        config.mappings = config.mappings.concat({
            src: config.inputDir,
            dest: config.outputDir
        });

    }

    // Sorted mappings order by src length
    config.mappings.sort(function (a, b) {
        return b.src.length - a.src.length;
    });
   

    // ignores
    if (data.ignores) {
        config.ignores = data.ignores.map(function (item) {
            if (item.match(/\\|\//)) {
                return path.join(root, item);
            }
            
            return item;
        });
    }

    return config;
};

/**
 * parse config of compass project
 * @param  {String} configRbPath config file path
 * @return {Object}              project config
 */
exports.parseCompassConfig = function (configRbPath, projectDir) {
    var config = {},
        data = configrb2json(configRbPath);

    config.language = 'compass';
    config.source = configRbPath;
    config.options = {
        compass: true
    };

    if (data.useSystemCommand) {
        config.useSystemCommand = true;
    }

    config.options.outputStyle = 'nested';
    if (data.output_style) {
        config.options.outputStyle =  data.output_style.replace(':','');
    }

    config.options.lineComments = true;
    if (data.line_comments !== undefined) {
        config.options.lineComments = data.line_comments;
    }

    config.options.sourceMap = false;
    if (data.sourcemap !== undefined) {
        config.options.sourceMap = data.sourcemap;
    }

    // get project root path
    var root;
    if (data.project_path) {
        if (data.project_path.indexOf('/') === 0 || data.project_path.match(/[a-zA-z]:/)) {
            root = data.project_path;
        } else {
            root = path.join(projectDir, data.project_path);
        }

    } else {
        root = projectDir;
    }

    config.inputDir = path.join(root, data.sass_dir);
    config.outputDir = path.join(root, data.css_dir);
    config.mappings = [{
        src: config.inputDir,
        dest: config.outputDir
    }];

    return config;
}

/**
 * config.rb convert to json
 * @param  {String} configPath config.rb path
 * @return {Object}            result object
 */
function configrb2json (configPath) {
    var config = fs.readFileSync(configPath).toString();

    //remove comments
    config = config.replace(/^[ ]*=begin[\w\W]*?=end[^\w]|^[ ]*#.*|#.+/gm, '').replace(/[\n\t\r]+/g, ',');

    var params = config.split(','),
        result = {};

    //if require any plugins than use compass command directly
    function hasRequireSystemPlugins (config) {
        var ret = config.match(/require.+/g),
            flag = false;

        if (ret && ret.length) {
            for (var i = ret.length - 1; i >= 0; i--) {
                var item = ret[i];
                item = item.match(/.+?[\"\'](.+?)[\"\']/) || [];
                if (item[1] && item[1].indexOf('compass/')!== 0) {
                    flag = true;
                    break;
                }
            }
        }

        return flag;
    }

    if (hasRequireSystemPlugins(config)) {
        result.useSystemCommand = true;
    }

    //get http_path, css_dir, sass_dir
    params.forEach(function (item) {
        if (item.length) {
            if (item.indexOf('=') === -1) {
                return false;
            }

            var p = item.split('='),
                key = p[0].trim(),
                val = p[1].trim();

            if (val === 'true' || val === 'false') {
                val = JSON.parse(val);
            }
            else if (val.indexOf('\'') === 0 || val.indexOf('\"') === 0) {
                val = val.slice(1, val.length - 1);
            }

            result[key] = val;
        }
    });

    return result;
}

/**
 * wacth settings file
 * @param  {String} dest settings file path
 */
function watchSettingsFile (dest) {
    if (!Array.isArray(dest)) dest = [dest];

    dest.forEach(function (item) {
        fs.unwatchFile(item);

        var src = path.dirname(item);
        fs.watchFile(item, {interval: 500}, function (curr) {
            if (curr.mode === 0) return false;

            // if change than apply the settings
            for (var k in projectsDb) {
                if (projectsDb[k].src === src) {
                    reloadProject(k);
                    break;
                }
            }
        });
    });
}
exports.watchSettingsFile = watchSettingsFile;

/**
 * reload project
 * @param  {String} pid project id
 */
function reloadProject (pid) {
    projectManager.reloadProject(pid, function () {
        $('#' + pid).trigger('reload');
    });
}

/**
 * format object key
 * @param  {string} key source key
 * @return {string}     formated key
 */
function formatKey (key) {
    var _key = key;
    if (/_/.test(key)) {
        _key = key.replace(/(_\w)/g, function (a) {return a.toUpperCase().substr(1)});
    }
    return _key;
}