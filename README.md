## Introduction

[![Join the chat at https://gitter.im/oklai/koala](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/oklai/koala?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

[http://koala-app.com](http://koala-app.com)

Koala is a GUI application for LESS, Sass and CoffeeScript compilation, to help web developers use these tools more efficiently for development.

[项目中文主页](http://koala-app.com/index-zh.html)

## Downloads
v2.0.3 release [Changelog](https://github.com/oklai/koala/blob/master/Changelog.md)

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
3. For windows, copy `nw.exe, nw.pak, icudt.dat` to `koala/src` directory, and install [Ruby](http://www.ruby-lang.org/) to `koala/src/ruby`;
For Linux, copy `nw, nw.pak`, install Ruby: `sudo apt-get install ruby`;
For Mac OS X, copy `node-webkit.app`, OS X already have Ruby installed.
4. Run the `nw` executable file.

## License

`koala`'s code uses the Apache license, Version 2.0, see our `LICENSE` file.


[![Bitdeli Badge](https://d2weczhvl823v0.cloudfront.net/oklai/koala/trend.png)](https://bitdeli.com/free "Bitdeli Badge")

