/**
 * upgrade patches
 */

'use strict';

var fs          = require('fs-extra'),
	path        = require('path'),
	FileManager = global.getFileManager(),
	util        = require('./util.js');

var hotfix = function () {
	if (!fs.existsSync(FileManager.settingsFile) || !fs.existsSync(FileManager.projectsFile)) return false;
	var appPackage = util.readJsonSync(FileManager.packageJSONFile),
		appConfig = util.readJsonSync(FileManager.settingsFile);

	var curVersion = util.parseVersion(appPackage.version.replace(/-.*/, '')),
		lastVersion = util.parseVersion((appConfig.appVersion || '0').replace(/-.*/, ''));

	if (curVersion === lastVersion) {
		return false;
	}

	// for merge global compiler settings
	appConfig.compilers = appConfig.compilers || {};
	['less', 'sass', 'coffeescript', 'compass'].forEach(function(item){
		var _item = item;
		if (_item === 'coffeescript') _item = 'coffee';
		appConfig.compilers[_item] = appConfig.compilers[_item] || {options: {}, advanced: {}};
		
		for (var k in appConfig[item]) {
			appConfig.compilers[_item].options[k] = appConfig[item][k];
		}
		
		delete appConfig[item];
	});

	// for merge using system command settings
	for (var cmdName in appConfig.useSystemCommand) {
		if (cmdName === 'less') {
			appConfig.compilers.less.advanced.useCommand = appConfig.useSystemCommand[cmdName]
		}
		if (cmdName === 'coffeescript') {
			appConfig.compilers.coffee.advanced.useCommand = appConfig.useSystemCommand[cmdName]
		}
		if (cmdName === 'sass') {
			appConfig.compilers.sass.advanced.useSassCommand = appConfig.useSystemCommand[cmdName]
		}
		if (cmdName === 'compass') {
			appConfig.compilers.compass.advanced.useCompassCommand = appConfig.useSystemCommand[cmdName]
		}
	}
	delete appConfig.useSystemCommand;

	fs.writeFileSync(FileManager.settingsFile, JSON.stringify(appConfig, null, '\t'));

	// for reset watch and compiler property
	var projectsDb = util.readJsonSync(FileManager.projectsFile) || {};
	for (var k in projectsDb) {
		if (projectsDb[k].files) {
			for (var j in projectsDb[k].files) {
				var file = projectsDb[k].files[j];
				file.watch = true;
				if (/sass|scss/.test(file.type)) {
					file.compiler = 'sass';
				}
				if (file.type === 'less') {
					file.compiler = 'less';
				}
				if (file.type === 'coffee') {
					file.compiler = 'coffee';
				}
			}
		}
	}

	fs.writeFileSync(FileManager.projectsFile, JSON.stringify(projectsDb, null, '\t'));

	// Migration UseData in Mac OSX
	if (process.platform === 'darwin' && FileManager.oldUserDataDir !== FileManager.userDataDir && fs.existsSync(FileManager.oldUserDataDir)) {
	    fs.readdirSync(FileManager.oldUserDataDir).forEach(function (fileName) {
	        fs.renameSync(path.join(FileManager.oldUserDataDir, fileName), path.join(FileManager.userDataDir, fileName));
	    });
	    fs.rmdirSync(FileManager.oldUserDataDir);
	}
}

// run
hotfix();