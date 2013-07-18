## How to create a language pack

**Step 1:** Copy the template files in the directory, translate views.json and context.json.

**Step 2:** After complete the translation, create a zip file, copy the files into the zip file, rename the file extension from `.zip` to `.koala-locales`.

For Linux/OS X, you can create the zip file form the command line.

1. Go to the template directory `cd ~/template_dir`
2. Run `zip -r language_name.koala-locales *`

**Step 3:** Done. Drag and drop the zip file into the Koala window to install the new language pack. After installation, switch to this language, test and ensure there are no errors.

### package.json

The language pack information.

```
{
	"language_name": "", // The language name.
	"language_code": "", // Language code. e.g "en_us".

	// The translator info.
	"translator": {
		"name": "",
		"email": "",
    	"web": ""
	},

	"app_version": "", // Corresponding koala version.

	"updated_date": "" // Updated date, format: yyyy-MM-dd.
}
```

### views.json / context.json

The two files is the content need to be translated.

Tips:

1. `${1|2|...}` This kind of similar character is a placeholder, don't delete them.
2. Note punctuation writing, sometimes need to be combined with a backslash.
3. If some of the fields you do not know how to translate, it does not matter, comment it, the program will use the default value.