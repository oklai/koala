/**
 * project manager
 */

'use strict';

var path             = require('path'),
    fs               = require('fs-extra'),
    storage          = require('./storage.js'),
    compilersManager = require('./compilersManager.js'),
    fileTypesManager = require('./fileTypesManager.js'),
    jadeManager      = require('./jadeManager.js'),
    fileWatcher      = require('./fileWatcher.js'),
    configManager    = require('./appConfigManager.js'),
    appConfig        = configManager.getAppConfig(),
    util             = require('./util.js'),
    notifier         = require('./notifier.js'),
    projectSettings  = require('./projectSettings.js'),
    $                = global.jQuery,
    projectsDb       = storage.getProjects(), //projects storage data
    globalIgnores    = appConfig.defaultIgnores.concat(appConfig.ignores);

/**
 * add project
 * @param {String}   src      folder src
 * @param {Function} callback callback function
 */
exports.addProject = function (src, callback) {
    var project = createProject(src),
        watchList = [],
        projectId = util.createRdStr();

    project.id = projectId;

    for (var k in project.files) {
        project.files[k].pid = projectId;

        if (project.files[k].watch) {
            watchList.push({
                pid: projectId,
                src: project.files[k].src
            });
        }
    }

    projectsDb[projectId] = project;
    storage.updateJsonDb();

    //watch files
    fileWatcher.add(watchList);

    //watch project settings file
    var settingsPath = project.config.source;
    if (settingsPath) {
        projectSettings.watchSettingsFile(settingsPath);
    }
    
    if (callback) callback(project);
}

/**
 * create project data object
 * @param  {String} src project dir
 * @return {Object}
 */
function  createProject (src) {
    var projectConfig =  loadExistsProjectConfig(src) || {};

    //get files
    var fileList = walkDirectory(projectConfig.inputDir || src, projectConfig.ignores),
        projectFiles = {};

    fileList.forEach(function (item) {
        projectFiles[item] = creatFileObject(item, projectConfig);
    });

    return {
        name: src.split(path.sep).slice(-1)[0],
        src: src,
        config: projectConfig,
        files: projectFiles
    }
}

/**
 * delete project
 * @param  {String}   id       target project id
 * @param  {Function} callback callback function
 */
exports.deleteProject = function (id, callback) {
    var fileList = [],
        project = projectsDb[id];

    for (var k  in project.files) fileList.push(k);

    fileWatcher.remove(fileList);   //remove watch listener

    delete projectsDb[id];
    storage.updateJsonDb();

    if (callback) callback();
}

/**
 * update project file list
 * @param  {String}   pid       project id
 * @param  {Function} callback callback function
 */
exports.refreshProjectFileList = function (pid, callback) {
    var project = projectsDb[pid],
        files = project.files,
        hasChanged = false,
        invalidFiles = [],
        invalidFileIds = [],
        projectConfig = project.config;

    //Check whether the file has been deleted
    for (var k in files) {
        var fileSrc = files[k].src;
        //The file does not exist, removed files
        if (!fs.existsSync(fileSrc)) {
            invalidFiles.push(fileSrc);
            invalidFileIds.push(files[k].id);
            delete files[k];
            hasChanged = true;
        }
    }

    if (invalidFiles.length > 0) fileWatcher.remove(invalidFiles);

    //Add new file
    var fileList = walkDirectory(projectConfig.inputDir || project.src, projectConfig.ignores);
    addFileItem(fileList, pid, function (newFiles) {
        if (callback) callback(invalidFileIds, newFiles);
        if (hasChanged && newFiles.length === 0) storage.updateJsonDb();
    });
}

/**
 * reload project, reapply the config
 * @param  {Number}   pid      project id
 * @param  {Function} callback
 */
exports.reloadProject = function (pid, callback) {
    var oldProject = projectsDb[pid];

    //Check the correct format of settings
    var source = oldProject.config.source;
    if (source && /koala-config.json/.test(source) && fs.existsSync(source)) {
        try {
            JSON.parse(util.replaceJsonComments(fs.readFileSync(source, 'utf8')));
        } catch (err) {
            notifier.throwError('Parse Error:\n' + err.message, source);
            return false;
        }
    }

    var oldFiles = [];
    for (var k  in oldProject.files) oldFiles.push(k);
    fileWatcher.remove(oldFiles);//remove watch listener

    var newProject= createProject(oldProject.src),
        watchList = [];

    for (var j in newProject.files) {
        newProject.files[j].pid = pid;

        if (newProject.files[j].watch) {
            watchList.push({
                pid: pid,
                src: newProject.files[j].src
            });
        }
    }

    newProject.id = pid;
    projectsDb[pid] = newProject;
    storage.updateJsonDb();

    //watch files
    fileWatcher.add(watchList);

    //watch project settings file
    var settingsPath = newProject.config.source;
    if (settingsPath) {
        projectSettings.watchSettingsFile(settingsPath);
    }

    if (callback) callback(newProject);
}

/**
 * load exists project config
 * @param  {String} src project dir
 * @return {Object} project config
 */
function loadExistsProjectConfig (src) {
    var settingsPath;

    settingsPath = path.join(src, 'config.rb');
    if (fs.existsSync(settingsPath)) {
        return projectSettings.parseCompassConfig(settingsPath, src);
    }

    settingsPath = path.join(src, 'koala-config.json');
    if (fs.existsSync(settingsPath)) {
        return projectSettings.parseKoalaConfig(settingsPath);
    }

    return null;
}

/**
 * add file to project
 * @param {String}   fileSrc  file path
 * @param {String}   pid      project id
 * @param {Function} callback
 */
function addFileItem (fileSrc, pid, callback) {
    var project = projectsDb[pid],
        files = project.files,
        projectConfig = project.config,
        hasChanged = false,
        ignores = projectConfig.ignores;

    //Add new file
    var fileList = Array.isArray(fileSrc) ? fileSrc : [fileSrc],
        newFiles = [],
        watchList = [];

    //filter invalid dir
    fileList = fileList.filter(function (item) {
        if (!isIgnoreDir(path.dirname(item), ignores)) {
            return item;
        }
    });
    //filter invalid file
    fileList = fileList.filter(isValidFile, ignores);

    fileList.forEach(function (item) {
        if (!files.hasOwnProperty(item)) {
            var fileObj = creatFileObject(item, projectConfig);
                fileObj.pid = pid;

            files[item] = fileObj;

            newFiles.push(fileObj);

            if (fileObj.watch) {
                watchList.push({
                    pid: pid,
                    src: item
                });
            }
            hasChanged = true;
        }
    });

    if (hasChanged) storage.updateJsonDb();

    if (newFiles.length > 0) fileWatcher.add(watchList);

    if (callback) callback(newFiles);
}
exports.addFileItem = addFileItem;

/**
 * remove file of the project
 * @param  {String} fileSrc target file src
 * @param  {String} pid     project id
 */
exports.removeFileItem = function (fileSrcList, pid, callback) {
    fileWatcher.remove(fileSrcList);

    var targetProjectFiles = projectsDb[pid].files;
    fileSrcList.forEach(function (item) {
        delete targetProjectFiles[item];
    });

    storage.updateJsonDb();
    callback && callback();
}


/**
 * Check the project directory state, whether it has been deleted
 */
exports.checkStatus = function () {
    var hasChanged = false,
        compilers = compilersManager.getCompilersName();

    for (var k in projectsDb) {
        var projectItem = projectsDb[k];
        //The directory does not exist, delete the project
        if (!fs.existsSync(projectItem.src)) {
            delete projectsDb[k];
            hasChanged = true;
            continue;
        }

        //Check the file
        for (var j in projectsDb[k].files) {
            var fileSrc = projectsDb[k].files[j].src,
                compiler = projectsDb[k].files[j].compiler;

            //The file does not exist, removed files
            if (!fs.existsSync(fileSrc) || compilers.indexOf(compiler) === -1) {
                hasChanged = true;
                delete projectsDb[k].files[j];
            }
        }
    }

    //If changed, re-save data
    if (hasChanged) {
        storage.updateJsonDb();
    }
}

/**
 * Update file settings
 * @param  {String}   pid          project ID
 * @param  {String}   fileSrc      File path
 * @param  {Object}   changeValue  Change value
 * @param  {Function} callback     callback
 */
exports.updateFile = function (pid, fileSrc, changeValue, callback, saveFlag) {
    var target = projectsDb[pid].files[fileSrc];
    for (var k in changeValue) {
        if (k === 'settings') {
            target.settings = $.extend(target.settings, changeValue.settings);
        } else {
            target[k] = changeValue[k];
        }
    }

    //save
    storage.updateJsonDb();

    //Update watch Listener
    fileWatcher.update({
        pid: pid,
        src: fileSrc
    });

    if (callback) callback();
}

/**
 * Detect directory already exists
 * @param  {String} src File Path
 * @return {Boolean}
 */
exports.checkProjectExists = function (src) {
    var projectItems = [],
        exists = false,
        id;

    for (var k in projectsDb) {
        projectItems.push(projectsDb[k]);
    }

    for (var i = 0; i < projectItems.length; i++) {
        if (projectItems[i].src === src) {
            exists = true;
            id = projectItems[i].id;
            break;
        }
    }

    return {
        exists: exists,
        id: id
    };
}


/**
 * Get all matching files in the directory
 * @param  {reing} root    dir path
 * @param  {array} ignores ignores rule
 * @return {array}         result files
 */
function walkDirectory(root, ignores) {
    var files = [];

    if (!fs.existsSync(root)) {
        return [];
    }

    function walk(dir) {
        // filter ignore dir
        if (dir !== root && isIgnoreDir(dir, ignores)) return false;

        var dirList = fs.readdirSync(dir);
        for (var i = 0; i < dirList.length; i++) {
            var item = dirList[i];
            //fiter system files
            if (/^\./.test(item)) {
                continue;
            }

            if (fs.statSync(path.join(dir, item)).isDirectory()) {
                try {
                    walk(path.join(dir, item));
                } catch (e) {

                }

            } else {
                //fiter files begin with '_'
                if (!/^_/.test(item)) {
                    files.push(path.join(dir, item));
                }
            }
        }
    }

    walk(root);
    return files.filter(isValidFile, ignores);
}
exports.walkDirectory = walkDirectory;

/**
 * [isValidDir description]
 * @param  {[type]}  dir     [description]
 * @param  {[type]}  ignores [description]
 * @return {Boolean}         [description]
 */
function isIgnoreDir (dir, ignores) {
    ignores = ignores ? globalIgnores.concat(ignores) : globalIgnores;

    return ignores.some(function (item) {
        if (item.indexOf('*') > -1) return false;
        if (item.indexOf(path.sep) > -1) {
            return dir.indexOf(item) > -1;
        }
        return path.basename(dir) === item;
    }); 
}

/**
 * Filter invalid file
 * @param  {String}  filePath
 * @return {Boolean}
 */
function isValidFile(filePath) {
    var extensions = fileTypesManager.getExtensions();

    var ext = path.extname(filePath).substr(1),
        name = path.basename(filePath);

    // concat global.ignores and custom ignores
    var ignores = globalIgnores;
    if (this) {
        ignores = ignores.concat(this);
    }

    // filter the file if it has been matched in ignores
    var inIgnores = ignores.some(function (item) {
        if (item.indexOf('*') === 0) {
            return name.indexOf(item.substr(1)) > -1;
        } 
    });

    if (inIgnores) return false;

    // filter the file if it not been supported by any compiler
    return extensions.some(function (k) {
        return ext === k;
    });
}


/**
 * Create File Object
 * @param  {String} fileSrc  File Path
 * @param  {Object} config   User Project Config
 * @return {Object} File Object
 */
function creatFileObject(fileSrc, config) {
    var extension= path.extname(fileSrc).substr(1),
        settings = {},
        fileType = fileTypesManager.getFileTypeByExt(extension),
        compilerName = fileType.compiler,
        compiler = compilersManager.getCompilerByName(compilerName),
        defaultOptions = configManager.getGlobalSettingsOfCompiler(compilerName).options,
        output   = getCompileOutput(fileSrc, config.mappings);

    //apply global settings && project settings
    if (defaultOptions) {
        for (var key in defaultOptions) {
            if (config.options && config.options.hasOwnProperty(key) && typeof(config.options[key]) === typeof(defaultOptions[key])) {
                 settings[key] = config.options[key];
            } else {
                settings[key] = defaultOptions[key];
            }
        }
    }

    return {
        id: util.createRdStr(),                         //ID
        pid: '',                                        //Project ID
        compiler: compilerName,                         //Compiler Name
        name: path.basename(fileSrc),                   //Name
        src: fileSrc,                                   //Path
        outputType: fileType.outputType,
        output: output,                                 //Output Path
        compile: fileType.autocompile,                  //whether to auto compile
        watch: fileType.watch,                          //whether to watch this file
        category: fileType.category,
        settings: settings                              //settings
    }
}

/**
 * Get file compile output path
 * @param  {String}   fileSrc file path
 * @param  {Object}   config project config
 * @return {String}   output path
 */
function getCompileOutput(fileSrc, mappings) {
    var extension = path.extname(fileSrc).substring(1),
        fileType = fileTypesManager.getFileTypeByExt(extension),
        output = fileSrc.slice(0, -extension.length) + fileType.output;

    // for mappings fre of koala-config
    var inMappings;
    if (mappings && mappings.length) {
        inMappings = mappings.some(function (item) {
            if (output.indexOf(item.src + path.sep) > -1) {
                output = output.replace(item.src, item.dest + path.sep);
                return true;
            }
        });

        if (inMappings) return output;
    }
    
    // for default
    var sep = path.sep,
        typeMent = sep + fileType.compiler + sep,
        targetMent = sep + fileType.output + sep,
        place = output.lastIndexOf(typeMent);

    if (place !== -1) {
        output = output.substr(0, place) + targetMent + output.substr(place + typeMent.length, output.length);
    }

    // If the same input and output (such as css minify), then concat a prefix
    if (fileSrc === output) {
        output = fileSrc.slice(0, -extension.length) + 'min.' + fileType.output;
    }

    if (fileType.outputType === 'dir') {
        output = fileSrc.slice(0, -(path.basename(fileSrc).length + 1));
    };

    return output;
}