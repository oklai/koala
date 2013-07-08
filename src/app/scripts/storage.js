/**
 * data storage module
 */

'use strict';

/*
//prject item
class projectItem
	String id
	Object project

prject model
class project{
	String id
	String name
	String src
	Object files
	Object config
}

file item
class files{
	String id
	Object file
}
file model
class file{
	String id
	String pid
	String type
	String name
	String src
	String output
	Boolean compile
	Array  imports
	Object settings{
		String outputStyle [nested] //outputstyle
	}
}
*/

var fs = require('fs'),
	path = require('path'),
	appConfig = require('./appConfig.js').getAppConfig();

var projectsDb = {};	//projects datatable object

/**
 * projectDb initializition
 */
function projectDbinitialize() {
	//To read data from the file
	if (!fs.existsSync(appConfig.projectsFile)) {
		fs.appendFile(appConfig.projectsFile, '');
	} else {
		var jsonString = fs.readFileSync(appConfig.projectsFile, 'utf8');
		try {
			projectsDb = JSON.parse(jsonString);
		} catch (e) {
			
		}
	}
}

projectDbinitialize();

/**
 * get projects datatable
 * @return {Object} projects datatable
 */
exports.getProjects = function () {
	return projectsDb;
};

//save projects to file
exports.updateJsonDb = function () {
	fs.writeFileSync(appConfig.projectsFile, JSON.stringify(projectsDb, null, '\t'));
};

/**
 * get import files record
 * @return {Obeject} importsCollection
 */
exports.getImportsDb = function () {
	//read data from file
	var data = {};

	if (fs.existsSync(appConfig.importsFile)) {
		var jsonString = fs.readFileSync(appConfig.importsFile, 'utf8');
		try {
			data = JSON.parse(jsonString);
		} catch (e) {

		}
	}

	return data;
};

/**
 * save import files record
 */
exports.saveImportsDb = function (json) {
	var fd = fs.openSync(appConfig.importsFile, 'w');
	fs.writeSync(fd, json);
	fs.closeSync(fd);
};

/**
 * get history data
 * @return {Object}
 */
exports.getHistoryDb = function () {
	var data = {};

	if (fs.existsSync(appConfig.historyFile)) {
		var jsonString = fs.readFileSync(appConfig.historyFile, 'utf8');
		try {
			data = JSON.parse(jsonString);
		} catch (e) {

		}
	}

	return data;
}

/**
 * save history data
 * @param  {String} json
 */
exports.saveHistoryDb = function (json) {
	var fd = fs.openSync(appConfig.historyFile, 'w');
	fs.writeSync(fd, json);
	fs.closeSync(fd);
};