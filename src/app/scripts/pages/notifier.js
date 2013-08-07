var win = require('nw.gui').Window.get();
    win.setAlwaysOnTop(true);

$('#close').click(function () {
    win.close();
});
//press esc to close
$(document).keydown(function (e) {
    if (e.which === 27) {
        win.close();
    }
});

// auto close
var notificationTimeId,
    autoClose = function () {
        notificationTimeId = setTimeout(function () {
            win.close();
        }, 5000);
    }

autoClose();

$(document.body).on('mouseenter', function () {
    if (notificationTimeId) clearTimeout(notificationTimeId);
}).on('mouseleave', function () {
    autoClose();
});