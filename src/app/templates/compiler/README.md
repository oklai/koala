## How to create a compiler pack

These files must contain at least in the compiler pack:

* package.json
* MyCompilerName.js
* path-to-icon/compilerName.png

### Package.json

## Quick Start

The package.json of CoffeeScript compiler

```
{
	"name": "coffee",

	"display": "CoffeeScript",

	"version": "1.0.0",

	"koalaVersion": ">=2.0.0",

	"main": "CoffeeScriptCompiler.js",

	"fileTypes": [{
		"extension": "coffee", 
		"output": "js",
		"icon": "../../assets/img/filetypes/coffee.png",
		"category": "script"
	}],

	"options": [
		{
			"type": "checkbox",
			"name": "bare",
			"display": "Bare",
			"default": false
		},
		{
			"type": "checkbox",
			"name": "literate",
			"display": "Literate",
			"default": false
		}
	],

	"advanced": [
		{
			"type": "checkbox",
			"name": "useCommand",
			"display": "Use the System CoffeeScript compiler",
			"default": false
		},
		{
			"type": "text",
			"name": "commandPath",
			"display": "Use the CoffeeScript executable at this path",
			"default": "",
			"placeholder": "Default: coffee",
			"depend": "useCommand"
		}
	],

	"projectSettings": "../settings/koala-config-of-coffee.json",

	"libraries": ["CoffeeScript@1.6.3"]
}

```

## Required Fields

Each package must provide all the following fields in its package descriptor file:  

### name
*(string)* The name of the package. This must be a unique, Camel-Case style name without spaces.

### display
*(string)* The display name of the compiler, it will be display in the options sidebar.

### version 
*(string)* Version of *this* compiler package.

### koalaVersion
*(string)* The dependent Koala version.

### main
*(string)* The compiler class file, relative to package.json.

### fileTypes
*(array)* The compiler associated file type, type item is a json object.

```
{
	"extension": "coffee", 
	"output": "js",
	"icon": "../../assets/img/filetypes/coffee.png",
	"category": "script"
}
```

#### extension  
*(string)* The extensions this type *uses*, can be an array of extensions or a single extension. All extensions do *NOT* start with a dot (e.g. '.txt' should be 'txt').

#### output
*(string)* The compiled output of the file extension.

#### icon
*(string)* The icon file of this file type, relative to package.json.

#### category
*(string)* The category of this file type, the value can be style, script, template, css, or javascript. 

## Features Control Fields

### options
*(array)* The Basis options of the compiler, all the files which associated by this compiler will apply the options

```
[
	// checkbox type option
	{
		"type": "checkbox",
		"name": "unixNewlines",
		"display": "Unix New Lines",
		"default": false
	},

	// droplist type option
	{
		"type": "droplist",
		"name": "outputStyle",
		"display": "Output Style",
		"items": [
			{
				"value": "nested",
				"text": "nested"
			},
			{
				"value": "expanded",
				"text": "expanded"
			}
		],
		"default": "nested"
	}
]
```

#### type
*(string)* Option type, the value can be checkbox, droplist, text, description.  
* `checkbox`: It will be converted to a checkbox type `<input>` element.
* `droplist`: It will be converted to a `<select>` element.
* `text`: It will be converted to a text type `<input>` element.
* `description`: It will be converted to a `<p>` element contains text.

#### name 
*(string)* The name of the option, it must be a unique, Camel-Case style name without spaces.

#### display
*(string)* The display name of the option.

#### items
*(array)* The values array of the `droplist` type.
* `value`: The value of the item.
* `text`: The display text of the item.

#### default
*(string)* or *(boolean)* The default value of this option. If the `type` is `checkbox`, the `default` must be a boolean value.

### advanced
*(array)* The advanced options of this compiler, it will only be as global settings of the compiler.

```
[
	{
		"type": "checkbox",
		"name": "useCommand",
		"display": "Use the System CoffeeScript compiler",
		"default": false
	},
	{
		"type": "text",
		"name": "commandPath",
		"display": "Use the CoffeeScript executable at this path",
		"default": "",
		"placeholder": "Default: coffee",
		"depend": "useCommand"
	}
]
```

### projectSettings
*(string)* The default project configuration template file of this compiler, relative to package.json.

### libraries
*(array)* The libraries of this compiler, use `@` partition name and version, e.g. `CoffeeScript@1.6.3`.