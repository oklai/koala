## Introduction

[http://koala-app.com](http://koala-app.com)

Koala is a GUI application for less, sass and coffeescript compilation, to help web developers to use less,sass and coffeescript development more efficient.

[项目中文主页](http://koala-app.com/index-zh.html)

## Downloads 
v1.4.0 release [Changelog](http://koala-app.com/#changelog)

[Download](http://koala-app.com) 


## Features

* **Multi-language Support:** support for Less, Sass, Compass Framework, CoffeeScript and Dust.
* **Real-time Compilation:** listening files, compile automatically when the file changes, that everything is running in the background without user action.
* **Compile Options Support:** you can set the compiler options for each file.
* **Compression:** auto compress code after compilation is completed.
* **Error Notification:** if encountered an error during compilation, koala will pop up the error message.
* **Cross-platform:** koal can run perfectly under windows, linux and mac.

## Screenshots

![linux](http://oklai.github.com/koala/images/screenshots/linux.png)

## Documents

`koala` is built with [node-webkit](https://github.com/rogerwang/node-webkit). node-webkit is an app runtime based on Chromium and node.js. You can write native apps in HTML and Javascript with node-webkit. 

### How to run Koala source code?
1. Clone Koala to the local;
2. Download [node-webkit](https://github.com/rogerwang/node-webkit) prebuilt binaries for your system environment.
3. For windows, copy `nw.exe, nw.pak, icudt.dll` to `koala/src` directory, and install [Ruby](http://www.ruby-lang.org/) to `koala/src/ruby`;  
For Linux, copy `nw, nw.pak`, install Ruby: `sudo apt-get install ruby`;  
For Mac OS X, copy `node-webkit.app`, OS X already have Ruby installed.
4. Run the `nw` executable file.

## License

`koala`'s code uses the Apache license, Version 2.0, see our `LICENSE` file.
