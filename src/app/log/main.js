/**
 * log 
 */

var gui       =  require('nw.gui'),
	logWindow =  gui.Window.get();

function renderPage () {
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
logWindow.on('close', function () {
	global.logWindow = null;
	this.close(true);
});