/**
 * ========================================================================
 * vsMask --遮罩层控件 依赖jQuery
 * ========================================================================
 */
(function (window, document, $, undefined) {
	// 默认配置
	var defaults = {
		powerOff: false, // 定时关闭
		offTime: 3 * 1000, // 默认关闭时间3秒
		html: "加载中..." // 遮罩层呈现的文字
	};

	// 遮罩层类
	function Mask(el, opt) {
		var self = this;
		self.$el = el;

		// 配置参数
		self.options = $.extend({}, defaults, opt);

		// 遮罩
		self.Base = $("<div class='vs-mask'></div>");
		self.ContentHtml = $("<div class='vs-mask-box-content'></div>");
		self.ContentHtml.html(self.options.html);
		self.ContentBox = $("<div class='vs-mask-box'></div>");

		self.ContentBox.append(self.ContentHtml);
		$("body").append(self.Base);
		$("body").append(self.ContentBox);
	}

	// 设置遮罩层尺寸
	function resizeMask() {
		var self = this;
		var $el = self.$el;
		var base = self.Base;
		var box = self.ContentBox;

		base.css("width", $el.outerWidth(true) + "px");
		base.css("height", $el.outerHeight(true) + "px");
		if (self.$el.html() != $(document).html() && $el.html() != $("body").html()) {
			base.css("left", $el.offset().left);
			base.css("top", $el.offset().top);
		}

		box.css("width", $el.outerWidth(true) + "px");
		box.css("height", $el.outerHeight(true) + "px");
		if (self.$el.html() != $(document).html() && $el.html() != $("body").html()) {
			box.css("left", $el.offset().left);
			box.css("top", $el.offset().top);
		}

		var content = self.ContentHtml;
		var marginTop = parseInt((box.height() - content.height()) / 2);
		content.css("margin-top", marginTop + "px");
	}

	function resetMask() {

	}

	// 遮罩层数据初始化
	Mask.prototype.init = function (opt) {
		var self = this;
		self.options = $.extend({}, self.defaults, opt);
	};

	// 显示遮罩层
	Mask.prototype.showMask = function () {
		var self = this;
		resizeMask.call(self);

		self.Base.show();
		self.ContentBox.show();
	};

	// 关闭遮罩层
	Mask.prototype.closeMask = function () {
		var self = this;
		resetMask.call(self);
		
		self.ContentBox.hide();
		self.Base.hide();
	};

	var old = $.fn.vsMask;

	// 将遮罩层控件作为jQuery的实例成员
	$.fn.vsMask = function (opt) {
		var self = this;

		var data = $.data(self[0], 'vsMask');

		if (data) {
			data.init(opt);
		} else {
			$.data(self[0], 'vsMask', (data = new Mask(self, opt)));
		}

		return data;
	};

	$.fn.vsMask.constructor = Mask;

	$.fn.vsMask.noConflict = function () {
		$.fn.vsMask = old;
		return this;
	};
})(window, document, jQuery);
