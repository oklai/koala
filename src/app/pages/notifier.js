var win = require('nw.gui').Window.get();
$('#close').click(function() {
	win.close();
});
//press esc to close
$(document).keydown(function (e) {
	if (e.which === 27) {
		win.close();
	}
});