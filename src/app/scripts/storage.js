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
    String extension
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

var fs          = require('fs'),
    path        = require('path'),
    util        = require('./util'),
    FileManager = global.getFileManager(),
    projectsDb;    //projects datatable object

/**
 * projectDb initializition
 */
function projectDbinitialize() {
    //To read data from the file
    if (!fs.existsSync(FileManager.projectsFile)) {
        fs.appendFile(FileManager.projectsFile, '');
    } else {
        projectsDb = util.readJsonSync(FileManager.projectsFile) || {};
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
    fs.writeFileSync(FileManager.projectsFile, JSON.stringify(projectsDb, null, '\t'));
};

/**
 * get import files record
 * @return {Obeject} importsCollection
 */
exports.getImportsDb = function () {
    //read data from file
    var data = {};

    if (fs.existsSync(FileManager.importsFile)) {
        data = util.readJsonSync(FileManager.importsFile);
    }

    return data;
};

/**
 * save import files record
 */
exports.saveImportsDb = function (json) {
    var fd = fs.openSync(FileManager.importsFile, 'w');
    fs.writeSync(fd, json);
    fs.closeSync(fd);
};

/**
 * get history data
 * @return {Object}
 */
exports.getHistoryDb = function () {
    return JSON.parse(global.mainWindow.window.localStorage.getItem('historyDb') || '{}');
};

/**
 * save history data
 * @param  {String} json
 */
exports.saveHistoryDb = function (data) {
    global.mainWindow.window.localStorage.setItem('historyDb', JSON.stringify(data));
};