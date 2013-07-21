# How to create an extension pack

**Step 1:** Copy the template files in the directory.

**Step 2:** Modify `package.json` to suit you needs.

**Step 3:** Add the compiler class(es), and the file type icon(s) if any.

**Step 4:** Create a zip file, copy the files into the zip file, rename the file extension from `.zip` to `.koala-extension`.

For Linux/OS X, you can create the zip file form the command line.

1. Go to the template directory `cd ~/template_dir`
2. Run `zip -r extension_name.koala-extension *`

**Step 5:** Done. Drag and drop the newly created `.koala-extension` file into the Koala window to install the new extension pack. After installation, quit and relunch Koala, test and ensure there are no errors.

## package.json

The extensioin pack information.

```
{
	// The name of this extension MUST BE *UNIQUE*.
	// @type {String}
	"name": "name_of_extension",

	// The discription of this extension.
	// @type {String}
	"description": "An example extension",

	// The version of this extension.
	// @type {String}
	"version": "1.0.0",

	// The version ok Koala required for this extension
	// @type {String}
	// @optional
	// @default "*" (any)
	"koala_version": ">=1.5.0",

	// A version of the properties for displaying.
	// @optional
	"display": "MyExtension",

	// The author info.
	// @type {Array.<Object>|Object}
	// @optional
	"maintainers": {
		"name": "",
		"email": "",
		"web": "",
		"project": "http://github.com/..."
	},

	// The compilers defined by this package.
	// @type {Array.<Compiler>|Compiler}
	// @optional
	"compilers": {
		// Compiler name MUST BE *UNIQUE*.
		// @type {String}
		"name": "my",

		// Version of the compiler *being used internally*.
		// @type {String}
		"compiler_version": "1.2.3",

		// The relative path to the compiler class, relative to this file.
		// @type {String}
		"class_path": "MyCompiler.js",

		// The file types used by this compiler.
		// @type {Array.<FileType>|FileType}
		// @optional
		"file_types": {
			// File type name MUST BE *UNIQUE*.
			// @type {String}
			"name": "my",

			// The extensions this type *uses*.
			// @type {Array.<String>|String}
			// @note **NB:** All extensions SHOULD NOT start with a dot (e.g. '.txt' should be 'txt').
			"extensions": ["my", "me"],

			// The icons to use.
			// @type {Array.<String>|String}
			// @optional
			// @default: "`name`.png"
			"icons": ["my.png"],

			// The output extension this type *uses*.
			// @type {String}
			// @note **NB:** All extensions SHOULD NOT start with a dot (e.g. '.txt' should be 'txt').
			"output_extension": "txt"
		},

		// Specifies if this compiler uses the system command.
		// @type {boolean}
		// @optional
		// @default false
		"use_system_command": false,

		// The list of options for this compiler.
		// @type {Array.<Object>|Object}
		// @optional
		"options": {
			// The type of this option
			// @type {Enum.<String>}
			// @values ["single", "multiple"]
			"type": "single",

			// The name of this option
			// @type {String}
			"name": "lineComments",

			// The displayed name of this option.
			// @type {String}
			// @optional
			// @default `name`
			"display": "line comments",

			// The possible values of this option.
			// @type {Array.<(Object|String)>}
			// @warn **ONLY APPLICABLE** if `type` is "multiple", otherwise it will be ignored.
			"values": {
				// The value
				// @type {String}
				"value": "",

				// The displayed value
				// @type {String}
				// @optional
				// @default `value`
				"display": "normal"
			},

			// The default value of this option.
			// @type {boolean|String}
			// @note Use 'boolean' if `type` is "single", use 'String' if `type` is "multiple".
			"default": false
		}
	}
}
```

## API

### Compiler
#### Properties

##### name
*Type* `String`

The name of the compiler. Its used as its identifier, and thus should be unique.
It's takin from the `package.json` file from the property named `name`.

##### compilerVersion
*Type* `String`

The version of the compiler used internally by the compiler.
It's takin from the `package.json` file from the property named `compiler_version`.

##### outputExtensions (do not use)
##### fileTypeNames (do not use)
##### fileTypes
*Type* `Array.<FileType>`

The file types accepted by the compiler.
It's takin from the `package.json` file from the property named `file_types` and made into `FileType` objects.

##### useSystemCommand
*Type* `boolean`

Whether or not the compiler is using the system command to compile.
It's takin from the `package.json` file from the property named `use_system_command`.

##### newOptions
*Type* `Array.<Object>`

The options for the compiler.
It's takin from the `package.json` file from the property named `options`.

##### options (do not use)
##### outputStyle (do not use)
##### display (do not use)
##### defaults (do not use)

#### Methods

##### Compiler(config)
The constructor for the compiler.

* *param* `config` is of type `Object` and corresponds to parsed JSON from `package.json`.

##### accepts(fileExtension)
##### getDisplay(propertyPath)
##### hasOptions()
##### hasOutputStyle() (do not use)
##### getOutputExtensionForFileType(fileTypeName)
##### getOptionsForFile(file)
Get the options for compiling "file".

* *param* `file` is of type `File` and is the file to compile.

##### getImports(filePath)
Gets all the file paths that the given file imports to be added to the compile list.

* *param* `filePath` is of type `String` and is the path of the file to get imports from.
* *returns* an `Array.<String>` containg all the file paths that `filePath` imports.

##### compile(file, success, fail)
The method that compiles the files.

* *param* `file` is of type `File` and is the file to compile.
* *param* `success` is of type `function()` and is success callback.
* *param* `fail` is of type `function()` and is failure callback.

##### compileFileWithSystemCommand(file, done)
The methods that compiles "file" using the system command.

* *param* `file` is of type `File` and is the file to compile.
* *param* `done` is of type `function(err)` and is the done callback.

##### compileFile(file, done)
The methods that compiles "file" using the internal compiler.

* *param* `file` is of type `File` and is the file to compile.
* *param* `done` is of type `function(err)` and is the done callback.

##### compileSource(sourceCode, sourceName, options, done)
The methods that compiles "sourceCode" using the internal compiler.

* *param* `sourceCode` is of type `String` and is the code to compile.
* *param* `sourceName` is of type `String` and is the name of the file containing the sourceCode.
* *param* `options` is of type `Object` and is the options for the compiler.
* *param* `done` is of type `function(err)` and is the done callback.

### FileType
#### Properties

##### name
*Type* `String`

The name of the file type. Its used as its identifier, and thus should be unique.
It's takin from the `package.json` file from the property named `name`.

##### extensions
##### icons
##### display (do not use)

#### Methods

##### FileType(config)
The constructor for the file type.

* *param* `config` is of type `Object` and corresponds to parsed JSON from `package.json`.

##### getDisplay(propertyPath)

### File
#### Properties

##### id
##### pid
##### extension
##### type
The name of the `FileType`.

##### name
##### src
##### output
##### compile
##### settings