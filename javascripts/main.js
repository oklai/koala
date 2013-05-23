$(function () {
	$('[name=download]').click(function () {
		var rel = this.rel.split(','),
	      system = rel[0],
	      bit = rel[1] || "",
	      version = $(this).closest('.item').data('version') || '';

	    var img = document.createElement('img');
	    img.src = "http://oklai.name/koala/count.php?system="+ system +"&bit=" + bit + "&version=" + version;
	    document.body.appendChild(img);
	});
});