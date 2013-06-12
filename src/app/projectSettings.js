/*
	project settings
 */

"use strict";

var path           = require('path'),
	fs             = require('fs-extra'),
	exec           = require('child_process').exec,
	appConfig      = require('./appConfig.js').getAppConfig(),
	util           = require('./util.js'),
	notifier       = require('./notifier.js'),
	il8n           = require('./il8n.js'),
	$              = global.jQuery,
	gui            = global.gui;

/**
 * create project config file
 * @param  {String}   type     project type
 * @param  {String}   target   project dir path
 * @param  {Function} callback 
 */
exports.create = function (type, target, callback) {
	var dest = type === 'compass' ? target + '/config.rb' : target + '/koala-config.json';

	//config file already exists
	if (fs.existsSync(dest)) {
		var settingsFileName = type === 'compass' ? 'Config.rb' : 'Koala-config.json',
			tips = il8n.__('Settings file has already exists. Do you want to edit it?', settingsFileName);
		$.koalaui.confirm(tips, function () {
			gui.Shell.openItem(dest);
		});
		return false;
	}

	if (type === 'compass') {
		//for compass
		var command = appConfig.systemCommand.compass ? 'compass' :'ruby -S "' + path.resolve() + '/bin/compass' + '"';
			command = command + ' ' + 'config config.rb';

		exec(command, {cwd: target, timeout: 5000}, function(error, stdout, stderr){
			if (error !== null) {
				$.koalaui.alert(stderr || stdout);
			} else {
				if (callback) callback(dest);
			}
		});
		
	} else {
		//for less, sass, coffeescript
		var tmpl = process.cwd() + '/settings/koala-config-of-' + type + '.json';
		fs.copy(tmpl, dest, function (err) {
			if (err) {
				$.koalaui.alert(err[0].message);
			} else {
				if (callback) callback(dest);
			}
		});
	}
}


/**
 * parse koala-config.json
 * @param  {String} configPath config file path
 * @return {Object}            project config
 */
exports.parseKoalaConfig = function (configPath) {
	var jsonStr = util.replaceJsonComments(fs.readFileSync(configPath, 'utf8')),
		data;

	try {
        data = JSON.parse(jsonStr);
    } catch (err) {
        $.koalaui.alert(il8n.__('Parse koala-config.json error.', err.message));
        return null;
    }

	//format config key
	var config = {},
		projectDir = path.dirname(configPath);

	//input dir and output dir
	for (var k in data) {
		if (/sass_dir|less_dir|coffee_dir/.test(k)) {
			config.inputDir = data[k];
		}
		else if (/css_dir|javascripts_dir/.test(k)) {
			config.outputDir = data[k];
		} else {
			var k2 = k.replace(/(_\w)/g, function(a){return a.toUpperCase().substr(1)});
			config[k2] = data[k];
		}
	}

	//compile options
	if (data.options) {
		config.options = {};
		for (var j in data.options) {
			var j2 = j.replace(/(_\w)/g, function(a){return a.toUpperCase().substr(1)});
			config.options[j2] = data.options[j];
		}	
	}

	//get full http path and input, output dir
	var httpPath = config.httpPath || '/';

	if (httpPath.indexOf('/') === 0) {
		httpPath = '.' + httpPath;
	}

	var root = path.resolve(projectDir, httpPath);

	config.httpPath = root;

	var inputDir = config.inputDir || '.',
		outputDir = config.outputDir || '.';

	if (inputDir.indexOf('/') !== 0) {
		config.inputDir = path.resolve(root, inputDir);
	}
	if (outputDir.indexOf('/') !== 0) {
		config.outputDir = path.resolve(root, outputDir);
	}

	return config;
};

/**
 * parse config of compass project
 * @param  {String} configRbPath config file path
 * @return {Object}              project config
 */
exports.parseCompassConfig = function (configRbPath) {
	var config = {},
		data = configrb2json(configRbPath);
	
	config.language = 'compass';
	config.options = {
		compass: true
	};

	if (data.useSystemCommand) {
		config.useSystemCommand = true;
	}

	if (data.output_style) {
		config.options.outputStyle =  data.output_style.replace(':','');
	}

	data.line_comments = true;
	if (data.line_comments !== undefined) {
		config.options.lineComments = data.line_comments;
	}

	var root = path.dirname(configRbPath),
		http_path = data.http_path || "/";

	http_path = http_path.indexOf('/') === 0 ? '.' + http_path : http_path;
	root = path.resolve(root, http_path);

	config.inputDir = path.resolve(root, data.sass_dir);
	config.outputDir = path.resolve(root, data.css_dir);

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
	if (/require/.test(config)) {
		result.useSystemCommand = true;
	}
	
	//get http_path, css_dir, sass_dir
	params.forEach(function (item) {
		if (item.length) {
			if (item.indexOf('=') === -1){
				return false;
			}

			var p = item.split('='),
				key = p[0].trim(),
				val = p[1].trim();

			if (/true|false/.test(val)) {
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