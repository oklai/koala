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
		var loadingElm = $('<div class="koalaui-loading"><span class="loadingimg"></span><div class="text"></div></div><div class="koalaui-overlay"></div>');

		function CreateLoading () {
			loadingElm.find('.text').html(text);
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
	 * @param  {String} status result status
	 * @param  {String} text   result message
	 * @return {Object}        tooltip object
	 */
	koalaui.tooltip = function (status, text) {
		var tooltip = $('<div class="koalaui-tooltip"></div>');
			text    = text || status;

		tooltip.addClass(status.toLowerCase()).html(text);
		tooltip.appendTo('body');
		
		setTimeout(function () {
			tooltip.hide().remove();
		}, 1000);
	};

	koalaui.confirm = function (text, okCallback, cancelCallback) {
		var confirmElm = $('<div class="koalaui-confirm"><div class="text"></div><footer><button class="cancel">Cancel</button><button class="ok">OK</button></footer></div><div class="koalaui-overlay"></div>');

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