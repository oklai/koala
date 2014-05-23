(function () {
	// get download link
	var downloads = window.DOWNLOADS || {};
	$('.download-windows').attr('href', downloads.windows);
	$('.download-mac').attr('href', downloads.mac);
	$('.download-linux32').attr('href', downloads.linux32);
	$('.download-linux64').attr('href', downloads.linux64);
	$('.download-ubuntu32').attr('href', downloads.ubuntu32);
	$('.download-ubuntu64').attr('href', downloads.ubuntu64);
	$('#download .version').text('Version ' + downloads.version + ', ' + downloads.update);

	// detect platform
	var platform = navigator.platform.toUpperCase();
	if (platform.indexOf('MAC') >= 0) {
		$('#download').removeClass('windowsSystem').addClass('macSystem');
	} else if (platform.indexOf('LINUX') >= 0) {
		$('#download').removeClass('windowsSystem').addClass('linuxSystem');
	}

	// all download link droplist
	$('#otherDownbox').mouseenter(function () {
		$(this).addClass('currentMenu');
		$(this).find('.otherBox').show();
	}).mouseleave(function () {
		$(this).removeClass('currentMenu');
		$(this).find('.otherBox').hide();
	})

	// download version statistics
	$('[name=download]').click(function () {
		var rel = this.rel.split(','),
	      system = rel[0],
	      bit = rel[1] || "",
	      version = $('#download').data('version') || '';

	    var img = document.createElement('img');
	    img.src = "http://oklai.name/koala/count.php?system="+ system +"&bit=" + bit + "&version=" + version;
	    document.body.appendChild(img);
	});

	// Donate 
	$('.donate-with-paypal').click(function () {
		$('#donateFormForPaypal').submit();
		return false;
	});
	$('.donate-with-alipay').click(function () {
		return false;
	}).mouseenter(function () {
		$('.alipay-tips').fadeIn(250);
	}).mouseleave(function () {
		$('.alipay-tips').fadeOut(250);
	});

	// banner animation
	setTimeout(function () {
		$('.bannerAnimation').addClass('start');
	}, 10)
})();