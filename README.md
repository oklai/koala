## Introduction

[http://koala-app.com](http://koala-app.com)

Koala is a GUI application for LESS, Sass and CoffeeScript compilation, to help web developers with them development more efficiently.

[项目中文主页](http://koala-app.com/index-zh.html)

## Downloads
v2.0.0 release [Changelog](http://koala-app.com/#changelog)

[Download](http://koala-app.com)


## Features

* **Multi-language Support:** support for LESS, Sass, Compass Framework, CoffeeScript and Dust.
* **Real-time Compilation:** listens to files, compiles automatically when file changes occur. Everything runs in the background without the need for user input.
* **Compile Options Support:** compilation options are avaliable per file.
* **Compression:** automatic compression of code after compilation has completed.
* **Error Notification:** if an error is encountered during compilation, Koala will display an error notification.
* **Cross-platform:** Koala runs perfectly on Windows, Linux and Mac.

## Screenshots

![linux](http://oklai.github.com/koala/img/screenshots/linux.png)

## Documents

`koala` is built with [node-webkit](https://github.com/rogerwang/node-webkit). node-webkit is an app runtime based on Chromium and node.js. You can write native apps in HTML and Javascript with node-webkit.

### How to run Koala source code?
1. Clone Koala to the local;
2. Download [node-webkit](https://github.com/rogerwang/node-webkit) prebuilt binaries for your system environment.
3. For windows, copy `nw.exe, nw.pak, icudt.dll` to `koala/src` directory, and install [Ruby](http://www.ruby-lang.org/) to `koala/src/ruby`;
For Linux, copy `nw, nw.pak`, install Ruby: `sudo apt-get install ruby`;
For Mac OS X, copy `node-webkit.app`, OS X already have Ruby installed.
4. Run the `nw` executable file.

##### build for grunt-node-webkit-builder
`npm install -g grunt-cli && npm install && grunt`

## License

`koala`'s code uses the Apache license, Version 2.0, see our `LICENSE` file.
