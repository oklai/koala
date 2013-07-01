#!/usr/bin/env node

/*
Just a simple nodejs wrapper around the .jar file
for easy CLI use
*/

var spawn = require('child_process').spawn,
    fs = require('fs'),
    compressor = require('./index'),
    args = process.argv.slice(2);

args.unshift(compressor.jar);
args.unshift('-jar');

var cmd = spawn('java', args);

cmd.stdout.on('data',function(data) {
    process.stdout.write(data.toString());
});
cmd.stderr.on('data',function(data) {
    process.stderr.write(data.toString());
});
