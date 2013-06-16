/**
 * UI components of koala
 */

(function ($) {

	'use strict';

	var koalaui = {};

	/**
	 * alert
	 * @param  {String} text alert text
	 */
	koalaui.alert = function (text) {
		var alertElm = $('<div class="koalaui-alert"><div class="text"></div><footer><button>OK</button></footer></div><div class="koalaui-overlay"></div>');

		alertElm.find('.text').html(text);
		alertElm.find('button').one('click', function () {
			alertElm.hide().remove();
		});
		alertElm.appendTo('body');
	};

	/**
	 * loading 
	 * @param  {String} text 
	 * @return {Object} loading object
	 */
	koalaui.loading = function (text) {
		var loadingElm = $('<div class="koalaui-loading"></div><div class="koalaui-overlay"></div>');

		function CreateLoading () {
			//loadingElm.find('.text').html(text);
			loadingElm.appendTo('body');

			this.hide = function () {
				loadingElm.hide().remove();
			};

			return this;
		}

		return new CreateLoading();
	};

	/**
	 * tooltip
	 * @param  {String} status result status (warn|success|error)
	 * @param  {String} text   result message
	 * @return {Object}        tooltip object
	 */
	koalaui.tooltip = function (status, text) {
		var tooltip = $('<div class="koalaui-tooltip"></div>');

		if (!text) {
			tooltip.addClass('bigfont');
			text = status;
		}

		tooltip.addClass(status.toLowerCase()).html(text);
		tooltip.appendTo('body');
		tooltip.css({
			"margin-top": -tooltip.innerHeight()/2,
			"margin-left": -tooltip.innerWidth()/2
		});
		
		setTimeout(function () {
			tooltip.hide().remove();
		}, 1000);
	};

	koalaui.confirm = function (text, okCallback, cancelCallback) {
		var confirmElm = $('<div class="koalaui-confirm"><div class="text"></div><footer><button class="ok">OK</button><button class="cancel">Cancel</button></footer></div><div class="koalaui-overlay"></div>');

		confirmElm.find('.text').html(text);
		confirmElm.appendTo('body');

		//trigger callback
		confirmElm.find('.ok').one('click', function () {
			if (okCallback) okCallback();
			
		});
		confirmElm.find('.cancel').one('click', function () {
			if (cancelCallback) cancelCallback();
		});

		//remove
		confirmElm.find('.ok, .cancel').one('click', function () {
			confirmElm.hide().remove();
		});
	};

	$.koalaui = koalaui;
})(jQuery);