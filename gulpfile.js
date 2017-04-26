var path = require('path');
var gulp = require('gulp');
var shelljs = require('shelljs');
var mergeStream = require('merge-stream');
var runSequence = require('run-sequence');
var manifest = require('./src/package.json');
var NwBuilder = require('nw-builder');

// Build for each platform; on OSX/Linux, you need Wine installed to build win32 (or remove winIco below)
['win32', 'osx64', 'linux32', 'linux64'].forEach(function(platform) {
  gulp.task(`build:${platform}`, function(callback) {
    var nw = new NwBuilder({
      files: path.resolve('./src/**'),
      platforms: [platform],
      version: 'latest',
      flavor: 'normal',
      appName: 'Koala',
      appVersion: manifest.version,
      winIco: process.argv.indexOf('--noicon') > 0 ? null : path.resolve('./assets-windows/icon.ico'),
      macIcns: path.resolve('./assets-osx/icon.icns'),
      macPlist: {
        NSHumanReadableCopyright: 'koala-app.com',
        CFBundleIdentifier: 'com.koala-app.koala',
      },
      zip: true,
    });

    nw.on('log',  console.log.bind(console));
    nw.build(callback);
  });
});

// Only runs on OSX (requires XCode properly configured)
gulp.task('sign:osx64', ['build:osx64'], function() {
  // shelljs.exec('codesign -v -f -s "Alexandru Rosianu Apps" ./build/Koala/osx64/Koala.app/Contents/Frameworks/*');
  // shelljs.exec('codesign -v -f -s "Alexandru Rosianu Apps" ./build/Koala/osx64/Koala.app');
  // shelljs.exec('codesign -v --display ./build/Koala/osx64/Koala.app');
  // shelljs.exec('codesign -v --verify ./build/Koala/osx64/Koala.app');
});

// Create a DMG for osx64; only works on OS X because of appdmg
gulp.task('pack:osx64', ['sign:osx64'], function() {
  shelljs.mkdir('-p', './dist');            // appdmg fails if ./dist doesn't exist
  shelljs.rm('-f', './dist/Koala.dmg');   // appdmg fails if the dmg already exists

  return gulp.src([])
    .pipe(require('gulp-appdmg')({
      source: './assets-osx/dmg.json',
      target: './dist/Koala.dmg',
    }));
});

// Create a nsis installer for win32; must have `makensis` installed
gulp.task('pack:win32', ['build:win32'], function() {
  shelljs.exec('makensis ./assets-windows/installer.nsi');
});

// Create packages for linux
[32, 64].forEach(function(arch) {
  gulp.task(`prepare:linux${arch}`, [`build:linux${arch}`], function() {
    shelljs.rm('-rf', `./build/linux${arch}`);

    const move_data = gulp.src([
      './assets-linux/koala.desktop',
      `./build/Koala/linux${arch}/**`,
    ])
      .pipe(gulp.dest(`./build/linux${arch}/usr/share/koala`));

    const move_icons = gulp.src('./assets-linux/icons/**')
      .pipe(gulp.dest(`./build/linux${arch}/usr/share/icons`));

    return mergeStream(move_data, move_icons);
  });

  ['deb', 'rpm'].forEach(function(target) {
    gulp.task(`pack:linux${arch}:${target}`, [`prepare:linux${arch}`], function() {
      const port = arch == 32 ? 'i386' : 'x86_64';

      shelljs.mkdir('-p', './dist'); // it fails if the dir doesn't exist
      shelljs.exec("'" + [
        'fpm',
        '--output-type', target,
        '--input-type', 'dir',
        '--chdir', `./build/linux${arch}`,
        '--package', `./dist/koala_${manifest.version}_${port}.${target}`,
        '--force',
        '--name', 'koala',
        '--version', manifest.version,
        '--license', 'Apache',
        '--vendor', '',
        '--category', 'devel',
        '--depends', 'ruby >= 1.8.7',
        '--architecture', port,
        '--maintainer', 'Ethan Lai <lain.z.q@gmail.com>',
        '--description', 'A cool tool for web developers.\nKoala is a GUI application for Less, Sass, Compass and CoffeeScript compilation, to help web developers to use them more efficient.',
        '--url', 'http://koala-app.com',
        '--after-install', './assets-linux/after-install.sh',
        '--after-remove', './assets-linux/after-remove.sh',
        '--deb-priority', 'optional',
        '--rpm-os', 'linux',
        '.',
      ].join("' '") + "'");
    });
  });

  gulp.task(`pack:linux${arch}:targz`, [`prepare:linux${arch}`], function() {
    const port = arch == 32 ? 'i386' : 'x86_64';

    shelljs.mkdir('-p', './dist'); // it fails if the dir doesn't exist
    shelljs.exec(`tar -czf './dist/koala_${manifest.version}_${port}.tar.gz' -C './build/linux${arch}' .`);
  });
});


// Make packages for all platforms
gulp.task('pack:all', function(callback) {
  runSequence('pack:osx64', 'pack:win32', 'pack:linux', callback);
});

// Make packages for linux platforms
gulp.task('pack:linux', function(callback) {
  runSequence('pack:linux32:deb', 'pack:linux64:deb', 'pack:linux32:rpm', 'pack:linux64:rpm', 'pack:linux32:targz', 'pack:linux64:targz', callback);
});

// Build osx64 and run it
gulp.task('run:osx64', ['build:osx64'], function() {
  shelljs.exec('open ./build/Koala/osx64/Koala.app');
});

// Run osx64 without building
gulp.task('open:osx64', function() {
  shelljs.exec('open ./build/Koala/osx64/Koala.app');
});

// Make packages for all platforms by default
gulp.task('default', ['pack:all']);
