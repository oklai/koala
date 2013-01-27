/**
 * jquery drag plugin
 * mousedown mousemove mouseup
 */
(function ($) {
	'use strict';

	function Drag (handle, options) {

		var startX, startY,
			endX, endY,
			tempX, tempY,
			currentX, currentY;

		handle.bind('mousedown', function (downEvent) {
			startX = downEvent.pageX;
			startY = downEvent.pageY;

			tempX = downEvent.pageX;
			tempY = downEvent.pageY;

			$('body').bind('mousemove', move);

			$('body').one('mouseup', function (upEvent) {
				$(this).unbind('mousemove', move);

				endX = parseInt(startX - upEvent.pageX);
				endY = parseInt(startY - upEvent.pageY);

				if (options.stop) options.stop(endX, endY);
			});
		});

		function move (moveEvent) {
			currentX = parseInt(moveEvent.pageX - tempX);
			currentY = parseInt(moveEvent.pageY - tempY);

			tempX = moveEvent.pageX;
			tempY = moveEvent.pageY;

			if (options.move) {
				options.move(currentX, currentY);
			}
		}
	}

	$.fn.drag = function (options) {
		this.each(function () {
			new Drag($(this), options);
		});
	};
})(jQuery);