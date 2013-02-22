/**
 * settings window script
 */

var fs        = require('fs'),
	appConfig = require('../../app/appConfig.js').getAppConfig();

var hasChange         = false,
	userConfigFile    = appConfig.userConfigFile,
	userConfigContent = fs.readFileSync(userConfigFile, 'utf8'),
	settings          = JSON.parse(userConfigContent);


function renderPage () {
	//less
	if (settings.less.compress) $('#less_outputStyle').find('[name=compress]')[0].selected = true;
	if (settings.less.yuicompress) $('#less_outputStyle').find('[name=yuicompress]')[0].selected = true;
	if (!settings.less.compress && !settings.less.yuicompress) $('#less_outputStyle').find('[name=normal]')[0].selected = true;

	//sass
	$('#sass_outputStyle').find('[name='+ settings.sass.outputStyle +']')[0].selected = true;
	$('#sass_compass')[0].checked = settings.sass.compass;
	$('#sass_lineComments')[0].checked = settings.sass.lineComments;
	$('#sass_unixNewlines')[0].checked = settings.sass.unixNewlines;

	//coffeescript
	$('#coffee_bare')[0].checked = settings.coffeescript.bare;
	$('#coffee_lint')[0].checked = settings.coffeescript.lint;

	//locales
	$('#locales').find('[name='+ settings.locales +']')[0].selected = true;

	//minimizeToTray
	$('#minimizeToTray')[0].checked = settings.minimizeToTray;

	//filter
	$('#filter').val(settings.filter.join());
}
renderPage();

//set less output style
$('#less_outputStyle').change(function () {
	var val = $(this).val();
	if (val === '') {
		settings.less.compress = false;
		settings.less.yuicompress = false;
	} 
	if (val === 'compress') {
		settings.less.compress = true;
		settings.less.yuicompress = false;
	}
	if (val === 'yuicompress') {
		settings.less.compress = false;
		settings.less.yuicompress = true;
	}
	hasChange = true;
});

//set sass compile options
$('#sass_outputStyle').change(function () {
	settings.sass.outputStyle = $(this).val();
	hasChange = true;
});

//set compass,lineComments,unixNewlines
$('#sass_options input[type=checkbox]').change(function () {
	var name = this.name;
	settings.sass[name] = this.checked;
	hasChange = true;
});

//set coffeescript options
$('#coffee_options input[type=checkbox]').change(function () {
	var name = this.name;
	settings.coffeescript[name] = this.checked;
	hasChange = true;
});

//set filter
$('#filter').keyup(function () {
	if ($(this).val() !== settings.filter.join()) hasChange = true;
})

//set locales
$('#locales').change(function () {
	settings.locales = this.value;
	hasChange = true;
});

//set minimize action
$('#minimizeToTray').change(function () {
	settings.minimizeToTray = this.checked;
	hasChange = true;
});

//save settings
var settingsWindow = require('nw.gui').Window.get();
settingsWindow.on('close', function () {
	this.hide();
	saveSettings();
	this.close(true);
});
$('#close').click(function() {
	settingsWindow.close();
});

function saveSettings () {
	if (hasChange) {
		var filterString = $('#filter').val().trim();
		if (!filterString) {
			settings.filter = []
		} else {
			settings.filter = filterString.split(',');
		}

		fs.writeFileSync(userConfigFile, JSON.stringify(settings, null, '\t'));

		//effective immediately
		delete settings.locales;
		for (var k in settings) {
			appConfig[k] = settings[k];
		}
	}
}