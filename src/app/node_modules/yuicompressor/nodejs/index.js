
var spawn = require('child_process').spawn,
    fs = require('fs'),
    path = require('path'),
    jar,
    exists = fs.exists || path.exists,
    lists = fs.readdirSync(path.join(__dirname, '../build'));

lists.some(function(item) {
    if (path.extname(item) === '.jar') {
        jar = path.join(__dirname, '../build/', item);
        return true;
    }
});

exports.jar = jar;

var defaultOptions = {
    charset: 'utf8',
    type: 'js'
};

var validOptions = {
    charset: 1,
    type: 1,
    'line-break': 1,
    nomunge: 1,
    'preserve-semi': 1,
    'disable-optimizations': 1
};

var getString = function(str, callback, options) {
    exists(str, function(y) {
        if (y) {
            var ext = (path.extname(str)).replace('.', '');
            fs.readFile(str, 'utf8', function(err, data) {
                //Set the type from the file name
                options.type = ext;
                callback(err, data, options);
            });
        } else {
            callback(null, str, options);
        }
    });
};


var filterOptions = function(options) {
    Object.keys(options).forEach(function(key) {
        if (!validOptions[key]) {
            delete options[key];
        }
    });

    options.type = options.type || 'js';
    options.charset = options.charset || 'utf8';
    return options;
};

var compressString = function(str, options, callback) {
    //Now we have a string, spawn and pipe it in.
    
    options = filterOptions(options);

    var args = [
        '-jar',
        exports.jar
    ], buffer = '', errBuffer = '', child;

    Object.keys(options).forEach(function(key) {
        args.push('--' + key);
        if (options[key] && options[key] !== true) {
            args.push(options[key]);
        }
    });

    child = spawn('java', args, {
        stdio: ['pipe', 'pipe', 'pipe']
    });

    child.stdin.write(str);
    child.stdin.end();
    
    child.stdout.on('data', function(chunk) {
        buffer += chunk;
    });
    child.stderr.on('data', function(chunk) {
        errBuffer += chunk;
    });
    
    child.on('exit', function() {
        var err = null;
        if (errBuffer.indexOf('[ERROR]') > -1) {
            err = errBuffer;
        }
        callback(err, buffer, errBuffer);
    });
};

var compress = function(str, options, callback) {
    if (typeof options === 'function') {
        callback = options;
        options = defaultOptions;
    }

    getString(str, function(err, str, options) {

        compressString(str, options, callback);
        
    }, options);
};

exports.compress = compress;
exports.compressString = compressString;
