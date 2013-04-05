/**
 * compile log 
 */

'use strict';

var path = require('path'),
	fs   = require('fs');

//Add error event listener
var errorLog = process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'] + '/.koala/error.log'; 
window.addEventListener('error', function (err) {
	var message = '---error---\n' + err.filename + ':' + err.lineno + '\n' + err.message + '\n\n';
	fs.appendFile(errorLog, message);
}, false);

function renderPage () {
	//distinguish between different platforms
	$('body').addClass(process.platform);
	
	var items = [];
	global.compileLog.forEach(function (item) {
		items.push(getItemHtml(item));
	});

	var html = '';
	for (var i = items.length -1; i >= 0; i--) {
		html += items[i];
	}

	$('#log ul').html(html);
}

var itemTmpl =$('#log_tmpl')[0].innerHTML;
function getItemHtml(log) {
	var html = itemTmpl;
	for (var k in log) {
		html = html.replace('{'+ k +'}', log[k]);
	}
	global.debug(html);
	return html;
}

renderPage();

//clear log
$('#clear').click(function () {
	global.compileLog = [];
	$('#log ul').html('');
});

//close log window
var logWindow =  require('nw.gui').Window.get();
logWindow.on('close', function () {
	global.logWindow = null;
	this.close(true);
});