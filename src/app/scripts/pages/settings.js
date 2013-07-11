/**
 * settings window
 */

'use strict';

var path = require('path'),
	fs   = require('fs');

//Add error event listener
var errorLog = process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'] + '/.koala/error.log'; 
window.addEventListener('error', function (err) {
	var message = '---error---\n' + err.filename + ':' + err.lineno + '\n' + err.message + '\n\n';
	fs.appendFile(errorLog, message);
	alert(message);
}, false);

var configManger      = require(global.appRootPth + '/scripts/appConfig.js'),
	localesManager    = require(global.appRootPth + '/scripts/localesManager.js'),
	appConfig         = configManger.getAppConfig(),
	appPackage        = configManger.getAppPackage(),
	hasChange         = false,
	userConfigFile    = appConfig.userConfigFile,
	userConfigContent = fs.readFileSync(userConfigFile, 'utf8'),
	settings          = JSON.parse(userConfigContent),
	util              = require(global.appRootPth + '/scripts/util.js'),
	il8n              = require(global.appRootPth + '/scripts/il8n.js'),
	gui               = require('nw.gui');

//render page
(function () {
	//distinguish between different platforms
	$('body').addClass(process.platform);

	var k;
	
	//less
	if (settings.less.compress) $('#less_outputStyle').find('[name=compress]')[0].selected = true;
	if (settings.less.yuicompress) $('#less_outputStyle').find('[name=yuicompress]')[0].selected = true;
	if (!settings.less.compress && !settings.less.yuicompress) $('#less_outputStyle').find('[name=normal]')[0].selected = true;
	for (k in settings.less) {
		if ($('#less_' + k)[0]) $('#less_' + k)[0].checked = settings.less[k];
	}

	//sass
	$('#sass_outputStyle').find('[name='+ settings.sass.outputStyle +']')[0].selected = true;
	for (k in settings.sass) {
		if ($('#sass_' + k)[0]) $('#sass_' + k)[0].checked = settings.sass[k];
	}

	//coffeescript
	for (k in settings.coffeescript) {
		if ($('#coffee_' + k)[0]) $('#coffee_' + k)[0].checked = settings.coffeescript[k];
	}

	//dust
	// for (k in settings.dust) {
	// 	if ($('#dust_' + k)[0]) $('#dust_' + k)[0].checked = settings.dust[k];
	// }

	//use system command
	for (k in settings.useSystemCommand) {
		if ($('#systemcommand_' + k)[0]) $('#systemcommand_' + k)[0].checked = settings.useSystemCommand[k];
	}


	//locales
	var locales = settings.locales, localesOpts;
	settings.languages.forEach(function (item) {
		localesOpts += '<option value="'+ item.code +'" name="' + item.code + '">'+ item.name +'</option>';
	});
	$('#locales').html(localesOpts);
	$('#locales').find('[name='+ locales +']')[0].selected = true;

	// translator
	var translator = localesManager.getLocalesPackage(locales).translator;
	if (translator.name === 'Official') {
		$('#translator').hide();
	} else {
		$('#translator a').attr('href', translator.web).text(translator.name);	
	}

	//minimize to tray
	$('#minimizeToTray')[0].checked = settings.minimizeToTray;

	//minimize on startup
	$('#minimizeOnStartup')[0].checked = settings.minimizeOnStartup;
	
	//filter
	$('#filter').val(settings.filter.join());

	//about
	var maintainers = appPackage.maintainers;
	$('#link_project').html(maintainers.project).attr('href', maintainers.project);
	$('#link_issues').html(maintainers.issues).attr('href', maintainers.issues);
	$('#koalaVersion').html(appPackage.version);

	// compiler version
	$('#lessVersion').html(appPackage.appinfo.less);
	$('#sassVersion').html(appPackage.appinfo.sass);
	$('#compassVersion').html(appPackage.appinfo.compass);
	$('#coffeeVersion').html(appPackage.appinfo.coffeescript);
	$('#dustVersion').html(appPackage.appinfo.dust);

	//open external link
	$(document).on('click', '.externalLink', function () {
		gui.Shell.openExternal($(this).attr('href'));
		return false;
	});
})();

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

//set  compass,lineComments,unixNewlines,debugInfo,literate,bare
$('#less_options, #sass_options, #coffee_options').find('input[type=checkbox]').change(function () {
	var name = this.name,
		rel  = $(this).data('rel');
	settings[rel][name] = this.checked;
	hasChange = true;
});

//set use system command enable
$('#systemcommand_options').find('input[type=checkbox]').change(function () {
	var id = $(this).attr('id'),
		rel = id.replace('systemcommand_', '');

	settings.useSystemCommand[rel] = this.checked;
	hasChange = true;
})

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
$('#minimizeToTray, #minimizeOnStartup').change(function () {
	settings[this.id] = this.checked;
	hasChange = true;
});

//Check Upgrade
function checkUpgrade () {
	$('#upgradeloading').show();

	var url = appPackage.maintainers.upgrade,
		currentVersion = appPackage.version;

	util.checkUpgrade(url, currentVersion, function (data, hasNewVersion) {
		if (hasNewVersion) {
			$('#newVersion').html(data.version);
			$('#upgradetips .update').show();
			$('#link_download').attr('href', data.download[appConfig.locales] || data.download.en_us);
		} else {
			$('#upgradetips .noupdate').show();
		}
		
	}, {
		success: function () {
			$('#upgradeloading').hide();
		},
		fail: function () {
			$('#upgradeloading').hide();
			alert(il8n.__('Network requests failed, please try again'));
		}
	});
}

$('#checkupgrade').click(checkUpgrade);

var saveSettings = function () {
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
// save settings
$('#ok').click(function () {
	saveSettings();
	parent.hideFrame();
});

// turn tab
$('#nav li').click(function () {
	if ($(this).hasClass('current')) return false;
	
	var rel = $(this).data('rel');
	$($('#nav li.current').data('rel')).hide();
	$(rel).show();

	$('.current').removeClass('current');
	$(this).addClass('current');
});

// close window
$('#cancel').click(function () {
	parent.hideFrame();
});
$(document).keydown(function (e) {
	if (e.which === 27) {
		parent.hideFrame();
	}
});
$('#titlebar .close').click(function() {
	parent.hideFrame();
});

