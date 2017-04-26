var closeWindow = window.close.bind(window);

document.getElementById('close').onclick = closeWindow;
document.onkeydown = function(e) {
    if (e.which === 27) {
        closeWindow();
    }
};

var notificationTimeId = setTimeout(closeWindow, 5000);

document.body.onmouseenter = function() {
    clearTimeout(notificationTimeId);
};
document.body.onmouseleave = function() {
    notificationTimeId = setTimeout(closeWindow, 5000);
};
