## Changelog

#### 2.0.0-beta (2013-9-2)
* JS/CSS minify and combine. [docs](https://github.com/oklai/koala/wiki/JS-CSS-minify-and-combine)
* Convert CSS images to base64. [docs](https://github.com/oklai/koala/wiki/JS-CSS-minify-and-combine#convert-css-images-to-base64)
* Build-in ruby in Windows version.
* Custom ruby and compiler libs support.
* Improve startup speed.
* 4 new language: 正體中文, Deutsch, Français, Português Brasileiro.
* Compiler extension support. [How to create a compiler extension?](https://github.com/oklai/koala/tree/master/src/app/templates/compiler)
* Custom Language Pack support. [How to create a language pack?](https://github.com/oklai/koala/tree/master/src/app/templates/locales)

#### 1.4.3 (2013-8-30)
* Fix bug [#41](https://github.com/oklai/koala/issues/41)
* Fix the bug the parent file can not auto compile when some imported LESS/Sass files modified.

#### 1.4.2 (2013-8-16)
* Fix bug: create compass project config error.
* Settings windows: move "Using System Libs" to "Advanced".

#### 1.4.1 2013-6-21
* Fix bug: version 1.4.0 can't run.
* New features: project settings, see the doc [here](https://github.com/oklai/koala/wiki/Using-project-settings).
* Compass full supports.
* Minimize on startup.
* Press "Esc" key to close the settings and log window.
* Update Less to version 1.4.0.
* Update CoffeeScript to version 1.6.3.
* Add Japanese language.
* Improved UI.

#### 1.3.1 (2013-6-3)
* Fix a bug: can't recognize files if forder has some file with the prefix "_".

#### 1.3.0 (2013-5-23)
* New features: allowed to switch run LESS , Sass and others directly, if them already installed on user computer.
* New features: increase the "open file" option in the context menu.
* Set the default output path for the directory at the same level with the project directory under css/js directory, for example: ./less -> ./css.
* Fix a bug: compilation error when directory name contains spaces.
* Fix a bug: config.rb parse error cause project can not be added
* UI improvements, tip refresh file list status.
* Increase the version number.

#### 1.0.2 (2013-4-28)
* Fix 1.0.1 version crash under proxy network environment.

#### 1.0.1 (2013-4-24)
* Settings file dialog initial path for the project directory path.

#### 1.0.1 beta2 (2013-4-18)
* Fix bug: to modify the file output path doesn't take effect immediately

#### 1.0.1 beta1 (2013-4-17)
* Used by default of compass config.rb.
* Multi-file operations, set outpath and delete function.
* Support Add file into the current project.
* Fix doesn't save project data bug.
* Fix doesn't start Mac OSX bug.