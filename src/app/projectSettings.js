/*
	project settings
 */

var path           = require('path'),
	fs             = require('fs-extra'),
	util           = require('./util.js'),
	notifier       = require('./notifier.js'),
	$              = global.jQuery;

/**
 * create project config file
 * @param  {String}   type     project type
 * @param  {String}   target   project dir path
 * @param  {Function} callback 
 */
exports.create = function (type, target, callback) {
	var tmpl = process.cwd() + '/tmpl/koala-config-' + type + '.json',
		dest = target + '/koala-config.json';

	//config file already exists
	if (fs.existsSync(dest)) {
		$.koalaui.alert('Settings file already exists, you can edit it directly.');
		return false;
	}

	fs.copy(tmpl, dest, function (err) {
		if (err) {
			$.koalaui.alert(err[0].message);
		} else {
			if (callback) callback(dest);
		}
	});
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
        $.koalaui.alert('parse koala-config.json error\n' + err.message);
        return null;
    }

	//format config key
	var config = {},
		projectDir = path.dirname(configPath);
	for (var k in data) {
		if (/sass_dir|less_dir|coffee_dir/.test(k)) {
			config.inputDir = data[k];
		}
		if (/css_dir|javascripts_dir/.test(k)) {
			config.outputDir = data[k];
		} else {
			var k2 = k.replace(/(_\w)/g, function(a){return a.toUpperCase().substr(1)});
			config[k2] = data[k];
		}
	}

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
		data = util.configrb2json(configRbPath);
	
	config.sass = {
		compass: true
	}
	if (data.output_style) {
		config.sass.outputStyle =  data.output_style.replace(':','');
	}

	if (data.line_comments !== undefined) {
		config.sass.lineComments = data.line_comments;
	}

	var root = path.dirname(configRbPath);
	var http_path = data.http_path || "/";
		http_path = http_path.indexOf('/') === 0 ? '.' + http_path : http_path;

	root = path.resolve(root, http_path);

	config.inputDir = path.resolve(root, data.sass_dir);
	config.outputDir = path.resolve(root, data.css_dir);

	return config;
}

