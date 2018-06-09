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

/**
 * ========================================================================
 * vsWin --浮动窗口控件 依赖jQuery,ko 参照jquery.simplemodal
 * ========================================================================
 */
(function (window, document, $, $ko, undefined) {
	var d = [], doc = $(document), ua = navigator.userAgent.toLowerCase(), wndw = $(window), w = [];

	var browser = {
		ieQuirks: null,
		msie: /msie/.test(ua) && !/opera/.test(ua),
		opera: /opera/.test(ua)
	};
	browser.ie6 = browser.msie && /msie 6./.test(ua) && typeof window.XMLHttpRequest !== 'object';
	browser.ie7 = browser.msie && /msie 7.0/.test(ua);
	browser.boxModel = (document.compatMode === "CSS1Compat");

	var defaults = {
		appendTo: 'body',
		focus: true,
		opacity: 50,
		// overlayId: null,
		overlayCss: {},
		// containerId: null,
		containerCss: {},
		// dataId: null,
		dataCss: {},
		minHeight: null,
		minWidth: null,
		maxHeight: null,
		maxWidth: null,
		autoResize: true,
		autoPosition: true,
		zIndex: 1000,
		title: $ko.observable(""),
		titleHTML: '<span class="vs-simplemodal-modalTitle"></span>',
		close: true,
		closeHTML: '<a class="vs-simplemodal-modalCloseImg"></a>',
		closeClass: 'vs-simplemodal-close',
		escClose: true,
		overlayClose: true,
		fixed: true,
		position: null,
		persist: true,
		modal: true,
		onOpen: null,
		onShow: null,
		onClose: null,
		onShut: null
	};

	/*
	 * Main modal object o = options
	 */
	var impl = {
		/*
		 * Contains the modal dialog elements and is the object passed back to
		 * the callback (onOpen, onShow, onClose) functions
		 */
		d: {},
		/*
		 * Initialize the modal dialog
		 */
		init: function (data, options) {
			var s = this;

			// don't allow multiple calls
			if (s.d.data) {
				return s;
			}

			browser.ieQuirks = browser.msie && !browser.boxModel;

			// merge defaults and user options
			s.o = $.extend({}, defaults, options);

			// keep track of z-index
			s.zIndex = s.o.zIndex;

			// set the onClose callback flag
			s.occb = false;

			// determine how to handle the data based on its type
			if (typeof data === 'object') {
				// convert DOM object to a jQuery object
				data = data instanceof $ ? data : $(data);
				s.d.placeholder = false;

				// if the object came from the DOM, keep track of its parent
				if (data.parent().parent().size() > 0) {
					data.before($('<span></span>').attr('id',
						'simplemodal-placeholder').css({
							display: 'none'
						}));

					s.d.placeholder = true;
					s.display = data.css('display');

					// persist changes? if not, make a clone of the element
					if (!s.o.persist) {
						s.d.orig = data.clone(true);
					}
				}
			} else if (typeof data === 'string' || typeof data === 'number') {
				// just insert the data as innerHTML
				data = $('<div></div>').html(data);
			} else {
				// unsupported data type!
				alert('SimpleModal Error: Unsupported data type: ' + typeof data);
				return s;
			}

			// create the modal overlay, container and, if necessary, iframe
			s.create(data);
			data = null;

			// display the modal dialog
			// s.open();

			// useful for adding events/manipulating data in the modal dialog
			// if ($.isFunction(s.o.onShow)) {
			// s.o.onShow.apply(s, [s.d]);
			// }

			// don't break the chain =)
			return s;
		},
		/*
		 * Create and add the modal overlay and container to the page
		 */
		create: function (data) {
			var s = this;

			// get the window properties
			s.getDimensions();

			// add an iframe to prevent select options from bleeding through
			if (s.o.modal && browser.ie6) {
				s.d.iframe = $('<iframe src="javascript:false;"></iframe>')
					.css($.extend(s.o.iframeCss, {
						display: 'none',
						opacity: 0,
						position: 'fixed',
						height: w[0],
						width: w[1],
						zIndex: s.o.zIndex,
						top: 0,
						left: 0
					})).appendTo(s.o.appendTo);
			}

			// create the overlay
			s.d.overlay = $('<div></div>')
				// .attr('id', s.o.overlayId)
				.addClass('vs-simplemodal-overlay').css($.extend(s.o.overlayCss, {
					display: 'none',
					opacity: s.o.opacity / 100,
					height: s.o.modal ? d[0] : 0,
					width: s.o.modal ? d[1] : 0,
					position: 'fixed',
					left: 0,
					top: 0,
					zIndex: s.o.zIndex + 1
				})).appendTo(s.o.appendTo);

			// create the container
			s.d.container = $('<div></div>')
				// .attr('id', s.o.containerId)
				.addClass('vs-simplemodal-container').css($.extend({
					position: s.o.fixed ? 'fixed' : 'absolute'
				}, s.o.containerCss, {
						display: 'none',
						zIndex: s.o.zIndex + 2
					}));

			s.d.top = $('<div></div>').addClass('vs-simplemodal-top').appendTo(s.d.container);

			s.d.container.append($(s.o.titleHTML).html(s.o.title())).appendTo(s.o.appendTo);
			s.d.container.append(s.o.close && s.o.closeHTML ? $(s.o.closeHTML).addClass(s.o.closeClass) : '').appendTo(s.o.appendTo);

			s.d.wrap = $('<div></div>').attr('tabIndex', -1).addClass(
				'vs-simplemodal-wrap').css({
					height: '100%',
					outline: 0,
					width: '100%'
				}).appendTo(s.d.container);

			// add styling and attributes to the data
			// append to body to get correct dimensions, then move to wrap
			s.d.data = data
				// .attr('id', data.attr('id') || s.o.dataId)
				.addClass('vs-simplemodal-data').css($.extend(s.o.dataCss, {
					display: 'none'
				})).appendTo('body');
			data = null;

			s.setContainerDimensions();
			s.d.data.appendTo(s.d.wrap);

			// fix issues with IE
			if (browser.ie6 || browser.ieQuirks) {
				s.fixIE();
			}
		},
		/*
		 * Bind events
		 */
		bindEvents: function () {
			var s = this;

			// bind the close event to any element with the closeClass class
			$('.' + s.o.closeClass).bind('click.simplemodal', function (e) {
				e.preventDefault();
				s.close();
			});

			// bind the overlay click to the close function, if enabled
			if (s.o.modal && s.o.close && s.o.overlayClose) {
				s.d.overlay.bind('click.simplemodal', function (e) {
					e.preventDefault();
					s.close();
				});
			}

			// bind keydown events
			doc.bind('keydown.simplemodal', function (e) {
				if (s.o.modal && e.keyCode === 9) { // TAB
					s.watchTab(e);
				} else if ((s.o.close && s.o.escClose) && e.keyCode === 27) { // ESC
					e.preventDefault();
					s.close();
				}
			});

			// update window size
			wndw.bind('resize.simplemodal orientationchange.simplemodal', function () {
				// redetermine the window width/height
				s.getDimensions();

				// reposition the dialog
				if (s.o.autoResize) {
					s.setContainerDimensions();
				}
				else {
					if (s.o.autoPosition) { s.setPosition(); }
				}

				if (browser.ie6 || browser.ieQuirks) {
					s.fixIE();
				} else if (s.o.modal) {
					// update the iframe & overlay
					if (s.d.iframe) {
						s.d.iframe.css({
							height: w[0],
							width: w[1]
						});
					}
					s.d.overlay.css({
						height: d[0],
						width: d[1]
					});
				}
			});

			//拖动窗口
			var move = false;// 移动标记
			var _x, _y;// 鼠标离控件左上角的相对位置
			s.d.top.bind('mousedown.simplemodal', function (e) {
				move = true;
				_x = e.pageX - parseInt(s.d.container.css("left"));
				_y = e.pageY - parseInt(s.d.container.css("top"));
			});
			doc.bind('mousemove.simplemodal', function (e) {
				if (move) {
					var x = e.pageX - _x;// 控件左上角到屏幕左上角的相对位置
					var y = e.pageY - _y;
					s.d.container.css({
						"top": y,
						"left": x
					});
				}
			});
			doc.bind('mouseup.simplemodal', function (e) {
				move = false;
			});
		},
		/*
		 * Unbind events
		 */
		unbindEvents: function () {
			$('.' + this.o.closeClass).unbind('click.simplemodal');
			doc.unbind('keydown.simplemodal');
			wndw.unbind('.simplemodal');
			this.d.overlay.unbind('click.simplemodal');

			doc.unbind('mousemove.simplemodal');
			doc.unbind('mouseup.simplemodal');
			this.d.top.unbind('mousedown.simplemodal');
		},
		/*
		 * Fix issues in IE6 and IE7 in quirks mode
		 */
		fixIE: function () {
			var s = this, p = s.o.position;

			// simulate fixed position - adapted from BlockUI
			$.each([s.d.iframe || null,
			!s.o.modal ? null : s.d.overlay,
			s.d.container.css('position') === 'fixed' ? s.d.container : null],
				function (i, el) {
					if (el) {
						var bch = 'document.body.clientHeight', bcw = 'document.body.clientWidth', bsh = 'document.body.scrollHeight', bsl = 'document.body.scrollLeft', bst = 'document.body.scrollTop', bsw = 'document.body.scrollWidth', ch = 'document.documentElement.clientHeight', cw = 'document.documentElement.clientWidth', sl = 'document.documentElement.scrollLeft', st = 'document.documentElement.scrollTop', s = el[0].style;

						s.position = 'absolute';
						if (i < 2) {
							s.removeExpression('height');
							s.removeExpression('width');
							s.setExpression('height', '' + bsh + ' > ' + bch + ' ? ' + bsh + ' : ' + bch + ' + "px"');
							s.setExpression('width', '' + bsw + ' > ' + bcw + ' ? ' + bsw + ' : ' + bcw + ' + "px"');
						} else {
							var te, le;
							if (p && p.constructor === Array) {
								var top = p[0] ? typeof p[0] === 'number' ? p[0].toString() : p[0].replace(/px/, '') : el.css('top').replace(/px/, '');
								te = top.indexOf('%') === -1 ? top + ' + (t = ' + st + ' ? ' + st + ' : ' + bst + ') + "px"'
									: parseInt(top.replace(/%/, '')) + ' * ((' + ch + ' || ' + bch + ') / 100) + (t = ' + st + ' ? ' + st + ' : ' + bst + ') + "px"';

								if (p[1]) {
									var left = typeof p[1] === 'number' ? p[1].toString() : p[1].replace(/px/, '');
									le = left.indexOf('%') === -1 ? left + ' + (t = ' + sl + ' ? ' + sl + ' : ' + bsl + ') + "px"'
										: parseInt(left.replace(/%/, '')) + ' * ((' + cw + ' || ' + bcw + ') / 100) + (t = ' + sl + ' ? ' + sl + ' : ' + bsl + ') + "px"';
								}
							} else {
								te = '(' + ch + ' || ' + bch + ') / 2 - (this.offsetHeight / 2) + (t = ' + st + ' ? ' + st + ' : ' + bst + ') + "px"';
								le = '(' + cw + ' || ' + bcw + ') / 2 - (this.offsetWidth / 2) + (t = ' + sl + ' ? ' + sl + ' : ' + bsl + ') + "px"';
							}
							s.removeExpression('top');
							s.removeExpression('left');
							s.setExpression('top', te);
							s.setExpression('left', le);
						}
					}
				});
		},
		/*
		 * Place focus on the first or last visible input
		 */
		focus: function (pos) {
			var s = this, p = pos && $.inArray(pos, ['first', 'last']) !== -1 ? pos : 'first';

			// focus on dialog or the first visible/enabled input element
			var input = $(':input:enabled:visible:' + p, s.d.wrap);
			setTimeout(function () {
				if (input.length > 0) { input.focus(); } else { s.d.wrap.focus(); }
			}, 10);
		},
		getDimensions: function () {
			// fix a jQuery bug with determining the window height - use
			// innerHeight if available
			var s = this, h = typeof window.innerHeight === 'undefined' ? wndw.height() : window.innerHeight;

			d = [doc.height(), doc.width()];
			w = [h, wndw.width()];
		},
		getVal: function (v, d) {
			return v ? (typeof v === 'number' ? v : v === 'auto' ? 0 : v.indexOf('%') > 0 ? ((parseInt(v.replace(/%/, '')) / 100) * (d === 'h' ? w[0] : w[1])) : parseInt(v.replace(/px/, ''))) : null;
		},
		/*
		 * Update the container. Set new dimensions, if provided. Focus, if
		 * enabled. Re-bind events.
		 */
		update: function (height, width) {
			var s = this;

			// prevent update if dialog does not exist
			if (!s.d.data) {
				return false;
			}

			// reset orig values
			s.d.origHeight = s.getVal(height, 'h');
			s.d.origWidth = s.getVal(width, 'w');

			// hide data to prevent screen flicker
			s.d.data.hide();
			if (height) { s.d.container.css('height', height); }
			if (width) { s.d.container.css('width', width); }
			s.setContainerDimensions();
			s.d.data.show();
			if (s.o.focus) { s.focus(); }
			// rebind events
			s.unbindEvents();
			s.bindEvents();
		},
		setContainerDimensions: function () {
			var s = this, badIE = browser.ie6 || browser.ie7;

			// get the dimensions for the container and data
			var ch = s.d.origHeight ? s.d.origHeight
				: browser.opera ? s.d.container.height() : s.getVal(
					badIE ? s.d.container[0].currentStyle.height
						: s.d.container.css('height'), 'h'), cw = s.d.origWidth ? s.d.origWidth
							: browser.opera ? s.d.container.width() : s.getVal(
								badIE ? s.d.container[0].currentStyle.width
									: s.d.container.css('width'), 'w'), dh = s.d.data
										.outerHeight(true), dw = s.d.data.outerWidth(true);

			s.d.origHeight = s.d.origHeight || ch;
			s.d.origWidth = s.d.origWidth || cw;

			// mxoh = max option height, mxow = max option width
			var mxoh = s.o.maxHeight ? s.getVal(s.o.maxHeight, 'h') : null, mxow = s.o.maxWidth ? s.getVal(s.o.maxWidth, 'w')
				: null, mh = mxoh && mxoh < w[0] ? mxoh : w[0], mw = mxow && mxow < w[1] ? mxow : w[1];

			// moh = min option height
			var moh = s.o.minHeight ? s.getVal(s.o.minHeight, 'h') : 'auto';
			if (!ch) {
				if (!dh) {
					ch = moh;
				} else {
					if (dh > mh) {
						ch = mh;
					} else if (s.o.minHeight && moh !== 'auto' && dh < moh) {
						ch = moh;
					} else {
						ch = dh;
					}
				}
			} else {
				ch = s.o.autoResize && ch > mh ? mh : ch < moh ? moh : ch;
			}

			// mow = min option width
			var mow = s.o.minWidth ? s.getVal(s.o.minWidth, 'w') : 'auto';
			if (!cw) {
				if (!dw) {
					cw = mow;
				} else {
					if (dw > mw) {
						cw = mw;
					} else if (s.o.minWidth && mow !== 'auto' && dw < mow) {
						cw = mow;
					} else {
						cw = dw;
					}
				}
			} else {
				cw = s.o.autoResize && cw > mw ? mw : cw < mow ? mow : cw;
			}

			s.d.container.css({
				height: s.o.autoResize ? "auto" : ch,
				minHeight: ch,
				width: cw
			});
			s.d.wrap.css({
				overflow: (dh > ch || dw > cw) ? 'auto' : 'visible'
			});
			if (s.o.autoPosition) { s.setPosition(); }
		},
		setPosition: function () {
			var s = this, top, left, hc = (w[0] / 2) - (s.d.container.outerHeight(true) / 2), vc = (w[1] / 2) - (s.d.container.outerWidth(true) / 2), st = s.d.container.css('position') !== 'fixed' ? wndw.scrollTop() : 0;

			if (s.o.position && Object.prototype.toString.call(s.o.position) === '[object Array]') {
				top = parseFloat(st) + parseFloat(s.o.position[0] || hc);
				left = s.o.position[1] || vc;
			} else {
				top = st + hc;
				left = vc;
			}
			s.d.container.css({
				left: left,
				top: top
			});
		},
		watchTab: function (e) {
			var s = this;

			if ($(e.target).parents('.vs-simplemodal-container').length > 0) {
				// save the list of inputs
				s.inputs = $(
					':input:enabled:visible:first, :input:enabled:visible:last',
					s.d.data[0]);

				// if it's the first or last tabbable element, refocus
				if ((!e.shiftKey && e.target === s.inputs[s.inputs.length - 1]) || (e.shiftKey && e.target === s.inputs[0]) || s.inputs.length === 0) {
					e.preventDefault();
					var pos = e.shiftKey ? 'last' : 'first';
					s.focus(pos);
				}
			} else {
				// might be necessary when custom onShow callback is used
				e.preventDefault();
				s.focus();
			}
		},
		/*
		 * Open the modal dialog elements - Note: If you use the onOpen
		 * callback, you must "show" the overlay and container elements manually
		 * (the iframe will be handled by SimpleModal)
		 */
		open: function () {
			var s = this;

			if ($.isFunction(s.o.onOpen)) {
				// execute the onOpen callback
				var r = s.o.onOpen.apply(s, [s.d]);

				if (r === false) {
					return;
				}
			}

			// display the iframe
			if (s.d.iframe) { s.d.iframe.show(); }

			// display the remaining elements
			s.d.overlay.show();
			s.d.container.show();
			s.d.data.show();

			if (s.o.focus) { s.focus(); }

			// bind default events
			s.bindEvents();
		},
		/*
		 * Close the modal dialog - Note: If you use an onClose callback, you
		 * must remove the overlay, container and iframe elements manually
		 * 
		 * @param {boolean} external Indicates whether the call to this function
		 * was internal or external. If it was external, the onClose callback
		 * will be ignored
		 */
		close: function () {
			var s = this;

			// prevent close when dialog does not exist
			if (!s.d.data) {
				return s;
			}

			// remove the default events
			s.unbindEvents();

			if ($.isFunction(s.o.onClose) && !s.occb) {
				// set the onClose callback flag
				s.occb = true;

				// execute the onClose callback
				s.o.onClose.apply(s, [s.d]);
			}

			// if the data came from the DOM, put it back
			if (s.d.placeholder) {
				var ph = $('#simplemodal-placeholder');
				// save changes to the data?
				if (s.o.persist) {
					// insert the (possibly) modified data back into the DOM
					ph.replaceWith(s.d.data.removeClass('vs-simplemodal-data')
						.css('display', s.display));
				} else {
					// remove the current and insert the original,
					// unmodified data back into the DOM
					s.d.data.hide().remove();
					ph.replaceWith(s.d.orig);
				}
			} else {
				// otherwise, remove it
				s.d.data.hide().remove();
			}

			// remove the remaining elements
			s.d.container.hide().remove();
			s.d.overlay.hide();
			if (s.d.iframe) { s.d.iframe.hide().remove(); }
			s.d.overlay.remove();

			// reset the dialog object
			s.d = {};

			if ($.isFunction(s.o.onShut)) {
				s.o.onShut();
			}
		}
	};

	$ko.vsWin = {
		ViewModel: function (opt) {
			var self = this;
			self.opt = opt;

			self.open = function (op) {
				if (op && op.title) {
					defaults.title(op.title);
				}

				var model = impl.init(self.el, self.opt);
				model.open();
			};

			self.close = function (op) {
				if (op && op.title) {
					defaults.title(op.title);
				}

				var model = impl.init(self.el, self.opt);
				model.close();
			};
		}
	};

	$ko.bindingHandlers.vsWin = {
		init: function (element, valueAccessor, allBindingsAccessor, viewModel,
			bindingContext) {

			var accessor = valueAccessor();
			accessor.el = element;
			element.style.display = "none";

			return {
				controlsDescendantBindings: false
			};
		},

		update: function (element, valueAccessor, allBindingsAccessor,
			viewModel, bindingContext) {
		}
	};

})(window, document, jQuery, ko);
/**
 * ========================================================================
 * vsCalendar --日历控件 依赖jQuery,ko 参考my97
 * ========================================================================
 */
(function (window, document, $, $ko, undefined) {
	// 日期文字
	var lang = {
		aWeekStr: ["周", "日", "一", "二", "三", "四", "五", "六"],
		aLongWeekStr: ["周次", "星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"],
		aMonStr: ["一", "二", "三", "四", "五", "六", "七", "八", "九", "十", "十一", "十二"],
		aLongMonStr: ["01月", "02月", "03月", "04月", "05月", "06月", "07月", "08月", "09月", "10月", "11月", "12月"],
		aHourStr: ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20","21", "22", "23"],
		aLongHourStr: ["00", "01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12", "13", "14", "15", "16", "17", "18","19", "20", "21", "22", "23"],
		aMinStr: ["0", "5", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"],
		aLongMinStr: ["00", "05", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"],
		aSecStr: ["0", "10", "20", "30", "40", "50"],
		aLongSecStr: ["00", "10", "20", "30", "40", "50"]
	};

	// 时长(转化成毫秒)
	var duration = {
		sec: 1000,
		min: 1000 * 60,
		hour: 1000 * 60 * 24,
		day: 1000 * 60 * 60 * 24
	};

	// 默认配置
	var defaults = {
		dateFmt: "yyyy-MM-dd", // 选择输出的时间格式
		minDate: "1900/01/01 00:00:00", // 最大时间--字符串形式
		maxDate: "2099/12/31 23:59:59", // 最小时间--字符串形式
		firstDayOfWeek: 0, // 每周第一天 0-6
		isShowWeek: false, // 是否显示周
		isShowDate: true, // 是否显示日期
		isShowTime: false, // 是否显示时分秒
		isEditHour: true, // 是否能编辑小时
		isEditMin: true, // 是否能编辑分钟
		isEditSec: true, // 是否能编辑秒种
		initDate: "", // 初始日期(只支持 yyyy-MM-dd和yyyy/MM/dd两种形式)
		css: {
			wday: "vs-calendar-Wday", // 普通日期样式
			wdayOn: "vs-calendar-WdayOn", // 普通日期样式(鼠标浮动)
			wwday: "vs-calendar-Wwday", // 周末日期样式
			wwdayOn: "vs-calendar-WwdayOn", // 周末日期样式(鼠标浮动)
			wtoday: "vs-calendar-Wtoday", // 当天日期样式
			wselday: "vs-calendar-Wselday", // 当前选择日期样式
			wspecialDay: "vs-calendar-WspecialDay", // 当前特别日期样式
			wotherDay: "vs-calendar-WotherDay", // 非当前月份日期样式
			wotherDayOn: "vs-calendar-WotherDayOn", // 非当前月份日期样式(鼠标浮动)
			winvalidDay: "vs-calendar-WinvalidDay", // 无效的日期样式
			wweek: "vs-calendar-Wweek" // 周期样式
		},
		zIndex: 9999,
		selectFn: null
	};

	$ko.vsCalendar = {
		// 构造函数
		ViewModel: function (opt) {
			var self = this;

			// 类属性
			self.options = $.extend(true, {}, defaults, opt);
			self.curDate = $ko.observable("");
			self.mTitle = [];

			self.mYear = $ko.observableArray([]);
			self.mMonth = $ko.observableArray([]);
			self.mDate = $ko.observableArray([]);
			self.mHour = $ko.observableArray([]);
			self.mMin = $ko.observableArray([]);
			self.mSec = $ko.observableArray([]);
			self.selTimeType = "h"; // 最近一次选择的时间点类型,默认为小时(h--小时,m--分钟,s--秒);

			// 获取选择的时间
			self.getSelectDate = $ko.observable("");
			// 获取选择的周次
			self.getSelectWeek = $ko.computed(function () {
				var d = $ko.unwrap(self.getSelectDate);
				if (d == "") {
					return "";
				} else {
					return getYearWeekByDate.call(self, d);
				}
			}, self);

			// 获取选择的时间(按指定的时间格式)
			self.getSelectDateStr = $ko.computed(function () {
				return date2str($ko.unwrap(self.getSelectDate),
					self.options.dateFmt);
			}, self);

			var initDate = self.options.initDate;
			var date = new Date();
			if (initDate != "") {
				date = strToDate(initDate);
			}
			self.setCurDate(date.getFullYear(), date.getMonth(),
				date.getDate(), date.getHours(), date.getMinutes(), date
					.getSeconds());

			if (initDate != "") {
				self.getSelectDate(self.curDate());
			}

			setTitle.call(self);
		}
	};

	// 显示日历控件
	$ko.vsCalendar.ViewModel.prototype.show = function (event) {
		var self = this;
		var date = self.getSelectDate();
		if (date != "") {
			self.setCurDate(date.getFullYear(), date.getMonth(),
				date.getDate(), date.getHours(), date.getMinutes(), date
					.getSeconds());
		}

		var e = $.event.fix(event || window.event);

		if (e.target) {
			var obj = e.target;
			var $obj = $(obj);
			var $obj_offset = $obj.offset();
			var $el = $(self.el);

			$el.css({
				left: $obj_offset.left + "px",
				top: $obj_offset.top + $obj.outerHeight() + "px",
				position: "absolute",
				"z-index": self.options.zIndex
			}).slideDown("fast");

			var onBodyDown = function (event) {
				if (obj == event.target || event.target.id == self.el.id || $(event.target).parents("#" + self.el.id).length > 0) {
					return;
				}
				$(self.el).fadeOut("fast");
				$("body").unbind("click.vsCalendar", onBodyDown);
			};

			$("body").bind("click.vsCalendar", onBodyDown);
		}
	};

	// 关闭日历控件
	$ko.vsCalendar.ViewModel.prototype.close = function () {
		var self = this;
		$(self.el).fadeOut("fast");
	};

	// 确定选择的时间
	$ko.vsCalendar.ViewModel.prototype.confirm = function () {
		var self = this;
		var curDate = self.curDate();
		self.getSelectDate(curDate);
		self.close();
	};

	// 清除选择的时间
	$ko.vsCalendar.ViewModel.prototype.clear = function () {
		var self = this;
		self.getSelectDate("");
		self.close();
	};

	/**
	 * 时间控件重置，可以重新指定配置参数
	 * 
	 * @param opt
	 */
	$ko.vsCalendar.ViewModel.prototype.reset = function (opt) {
		var self = this;

		self.getSelectDate("");

		if (opt != null) {
			self.options = $.extend(true, {}, defaults, self.options, opt);
		}

		var initDate = self.options.initDate;
		var date = new Date();
		if (initDate != "") {
			date = strToDate(initDate);
		}
		self.setCurDate(date.getFullYear(), date.getMonth(), date.getDate(),
			date.getHours(), date.getMinutes(), date.getSeconds());

		if (initDate != "") {
			self.getSelectDate(self.curDate());
		}

		self.selTimeType = "h";
		setTitle.call(self);
	};

	// 人工设置选择时间
	$ko.vsCalendar.ViewModel.prototype.selectDate = function (initDate) {
		var self = this;
		var date = strToDate(initDate);
		self.setCurDate(date.getFullYear(), date.getMonth(), date.getDate(),
			date.getHours(), date.getMinutes(), date.getSeconds());
		self.getSelectDate(self.curDate());
	};

	// 设置当前日历时间
	$ko.vsCalendar.ViewModel.prototype.setCurDate = function (year, month, date,
		hour, min, sec) {
		var self = this;
		var curDate = self.curDate();

		if (year == undefined) {
			year = curDate.getFullYear();
		}
		if (month == undefined) {
			month = curDate.getMonth();
		}
		if (date == undefined) {
			date = curDate.getDate();
		}
		var lDate = (new Date(year, month + 1, 0)).getDate();

		if (hour == undefined) {
			hour = curDate.getHours();
		}
		if (min == undefined) {
			min = curDate.getMinutes();
		}
		if (sec == undefined) {
			sec = curDate.getSeconds();
		}

		date = lDate > date ? date : lDate;
		hour = hour > 23 ? 0 : hour < 0 ? 23 : hour;
		min = min > 59 ? 0 : min < 0 ? 59 : min;
		sec = sec > 59 ? 0 : sec < 0 ? 59 : sec;

		var newDate = new Date(year, month, date, hour, min, sec);

		var maxDate = new Date(self.options.maxDate);
		var minDate = new Date(self.options.minDate);
		if (newDate > maxDate) {
			newDate = maxDate;
		} else if (newDate < minDate) {
			newDate = minDate;
		}

		year = newDate.getFullYear();
		month = newDate.getMonth();
		date = newDate.getDate();
		hour = newDate.getHours();
		min = newDate.getMinutes();
		sec = newDate.getSeconds();
		if (self.options.isEditHour == false) {
			hour = 0;
		}
		if (self.options.isEditMin == false) {
			min = 0;
		}
		if (self.options.isEditSec == false) {
			sec = 0;
		}
		newDate = new Date(year, month, date, hour, min, sec);

		self.curDate(newDate);

		setDateList.call(self);
	};

	// 通过年份设置日历上当前选择的时间
	$ko.vsCalendar.ViewModel.prototype.setYear = function (year) {
		var self = this;
		var curDate = self.curDate();
		self.setCurDate(year, curDate.getMonth());
	};

	// 通过月份设置日历上当前选择的时间
	$ko.vsCalendar.ViewModel.prototype.setMonth = function (month) {
		var self = this;
		var curDate = self.curDate();
		self.setCurDate(curDate.getFullYear(), month);
	};

	// 通过年、月、日设置日历上当前选择的时间
	$ko.vsCalendar.ViewModel.prototype.setDate = function (year, month, date) {
		var self = this;
		var curDate = self.curDate();
		self.setCurDate(year, month, date);

		if (curDate.getFullYear() == year && curDate.getMonth() == month && curDate.getDate() == date) {
			self.confirm();
			return;
		}
	};

	// 通过小时设置日历上当前选择的时间
	$ko.vsCalendar.ViewModel.prototype.setHour = function (hour) {
		var self = this;
		var curDate = self.curDate();
		self.setCurDate(curDate.getFullYear(), curDate.getMonth(), curDate
			.getDate(), hour);
	};

	// 通过分钟设置日历上当前选择的时间
	$ko.vsCalendar.ViewModel.prototype.setMin = function (min) {
		var self = this;
		var curDate = self.curDate();
		self.setCurDate(curDate.getFullYear(), curDate.getMonth(), curDate
			.getDate(), curDate.getHours(), min, curDate.getSeconds());
	};

	// 通过秒钟设置日历上当前选择的时间
	$ko.vsCalendar.ViewModel.prototype.setSec = function (sec) {
		var self = this;
		var curDate = self.curDate();
		self.setCurDate(curDate.getFullYear(), curDate.getMonth(), curDate
			.getDate(), curDate.getHours(), curDate.getMinutes(), sec);
	};

	// 设置当天日历上当前选择的时间
	$ko.vsCalendar.ViewModel.prototype.setToday = function () {
		var self = this;
		var today = new Date();
		self.setCurDate(today.getFullYear(), today.getMonth(), today.getDate(),
			today.getHours(), today.getMinutes(), today.getSeconds());
	};

	// 设置上个时间点(小时，分钟，秒钟)日历上当前选择的时间
	$ko.vsCalendar.ViewModel.prototype.setPrevTime = function () {
		var self = this;
		var curDate = self.curDate();
		switch (self.selTimeType) {
			case "m":
				if (self.options.isEditMin == true) {
					self.setCurDate(curDate.getFullYear(), curDate.getMonth(),
						curDate.getDate(), curDate.getHours(), curDate
							.getMinutes() - 1, curDate.getSeconds());
				}
				break;
			case "s":
				if (self.options.isEditSec == true) {
					self.setCurDate(curDate.getFullYear(), curDate.getMonth(),
						curDate.getDate(), curDate.getHours(), curDate
							.getMinutes(), curDate.getSeconds() - 1);
				}
				break;
			case "h":
				if (self.options.isEditHour == true) {
					self.setCurDate(curDate.getFullYear(), curDate.getMonth(),
						curDate.getDate(), curDate.getHours() - 1, curDate
							.getMinutes(), curDate.getSeconds());
				}
				break;
			default:
				if (self.options.isEditHour == true) {
					self.setCurDate(curDate.getFullYear(), curDate.getMonth(),
						curDate.getDate(), curDate.getHours() - 1, curDate
							.getMinutes(), curDate.getSeconds());
				}
				break;
		}
	};

	// 设置上月日历上当前选择的时间
	$ko.vsCalendar.ViewModel.prototype.setPrevMonth = function () {
		var self = this;
		var curDate = self.curDate();
		self.setCurDate(curDate.getFullYear(), curDate.getMonth() - 1);
	};

	// 设置上年日历上当前选择的时间
	$ko.vsCalendar.ViewModel.prototype.setPrevYear = function () {
		var self = this;
		var curDate = self.curDate();
		self.setCurDate(curDate.getFullYear(), curDate.getMonth() - 12);
	};

	// 设置下个时间点(小时，分钟，秒钟)日历上当前选择的时间
	$ko.vsCalendar.ViewModel.prototype.setNextTime = function () {
		var self = this;
		var curDate = self.curDate();
		switch (self.selTimeType) {
			case "m":
				if (self.options.isEditMin == true) {
					self.setCurDate(curDate.getFullYear(), curDate.getMonth(),
						curDate.getDate(), curDate.getHours(), curDate
							.getMinutes() + 1, curDate.getSeconds());
				}
				break;
			case "s":
				if (self.options.isEditSec == true) {
					self.setCurDate(curDate.getFullYear(), curDate.getMonth(),
						curDate.getDate(), curDate.getHours(), curDate
							.getMinutes(), curDate.getSeconds() + 1);
				}
				break;
			case "h":
				if (self.options.isEditHour == true) {
					self.setCurDate(curDate.getFullYear(), curDate.getMonth(),
						curDate.getDate(), curDate.getHours() + 1, curDate
							.getMinutes(), curDate.getSeconds());
				}
				break;
			default:
				if (self.options.isEditHour == true) {
					self.setCurDate(curDate.getFullYear(), curDate.getMonth(),
						curDate.getDate(), curDate.getHours() + 1, curDate
							.getMinutes(), curDate.getSeconds());
				}
				break;
		}
	};

	// 设置下月日历上当前选择的时间
	$ko.vsCalendar.ViewModel.prototype.setNextMonth = function () {
		var self = this;
		var curDate = self.curDate();
		self.setCurDate(curDate.getFullYear(), curDate.getMonth() + 1);
	};

	// 设置下年日历上当前选择的时间
	$ko.vsCalendar.ViewModel.prototype.setNextYear = function () {
		var self = this;
		var curDate = self.curDate();
		self.setCurDate(curDate.getFullYear(), curDate.getMonth() + 12);
	};

	// 获取当前年的字符串
	$ko.vsCalendar.ViewModel.prototype.getCurYearStr = function () {
		var self = this;
		return self.curDate().getFullYear() + '年';
	};

	// 获取当前月的字符串
	$ko.vsCalendar.ViewModel.prototype.getCurMonthStr = function () {
		var self = this;
		var month = self.curDate().getMonth();
		return lang.aLongMonStr[month];
	};

	// 获取当前小时的字符串
	$ko.vsCalendar.ViewModel.prototype.getCurHourStr = function () {
		var self = this;
		var hour = self.curDate().getHours();

		return lang.aLongHourStr[hour];
	};

	// 获取当前分钟的字符串
	$ko.vsCalendar.ViewModel.prototype.getCurMinStr = function () {
		var self = this;
		var min = self.curDate().getMinutes();

		if (min >= 0 && min < 10) {
			min = "0" + min;
		}
		return min;
	};

	// 获取当前秒钟的字符串
	$ko.vsCalendar.ViewModel.prototype.getCurSecStr = function () {
		var self = this;
		var sec = self.curDate().getSeconds();

		if (sec >= 0 && sec < 10) {
			sec = "0" + sec;
		}
		return sec;
	};

	// 显示年份列表
	$ko.vsCalendar.ViewModel.prototype.showYearList = function (data, event, year) {
		var self = this;
		var $el = $(self.el);
		setYearList.call(self, year);

		var $y = $(".vs-calendar-YMenu", $el);
		$y.show();

		var e = $.event.fix(event || window.event);
		if (e.target) {
			var obj = e.target;

			var onBodyDown = function (event) {
				if (obj == event.target) {
					return;
				}
				$y.hide();
				$("body").unbind("click.vsCalendar", onBodyDown);
			};

			$("body").bind("click.vsCalendar", onBodyDown);
		}
	};

	// 显示月份列表
	$ko.vsCalendar.ViewModel.prototype.showMonthList = function (data, event) {
		var self = this;
		var $el = $(self.el);
		setMonthList.call(self);

		var $m = $(".vs-calendar-MMenu", $el);
		$m.show();

		var e = $.event.fix(event || window.event);
		if (e.target) {
			var obj = e.target;

			var onBodyDown = function (event) {
				if (obj == event.target) {
					return;
				}
				$m.hide();
				$("body").unbind("click.vsCalendar", onBodyDown);
			};

			$("body").bind("click.vsCalendar", onBodyDown);
		}
	};

	// 显示小时列表
	$ko.vsCalendar.ViewModel.prototype.showHourList = function (data, event) {
		var self = this;
		self.selTimeType = "h";
		if (self.options.isEditHour == false) {
			return;
		}

		var $el = $(self.el);
		setHourList.call(self);

		var $m = $(".vs-calendar-HHMenu", $el);
		$m.show();

		var e = $.event.fix(event || window.event);
		if (e.target) {
			var obj = e.target;

			var onBodyDown = function (event) {
				if (obj == event.target) {
					return;
				}
				$m.hide();
				$("body").unbind("click.vsCalendar", onBodyDown);
			};

			$("body").bind("click.vsCalendar", onBodyDown);
		}
	};

	// 显示分钟列表
	$ko.vsCalendar.ViewModel.prototype.showMinList = function (data, event) {
		var self = this;
		self.selTimeType = "m";
		if (self.options.isEditMin == false) {
			return;
		}

		var $el = $(self.el);
		setMinList.call(self);

		var $m = $(".vs-calendar-MMMenu", $el);
		$m.show();

		var e = $.event.fix(event || window.event);
		if (e.target) {
			var obj = e.target;

			var onBodyDown = function (event) {
				if (obj == event.target) {
					return;
				}
				$m.hide();
				$("body").unbind("click.vsCalendar", onBodyDown);
			};

			$("body").bind("click.vsCalendar", onBodyDown);
		}
	};

	// 显示秒列表
	$ko.vsCalendar.ViewModel.prototype.showSecList = function (data, event) {
		var self = this;
		self.selTimeType = "s";
		if (self.options.isEditSec == false) {
			return;
		}

		var $el = $(self.el);
		setSecList.call(self);

		var $m = $(".vs-calendar-SSMenu", $el);
		$m.show();

		var e = $.event.fix(event || window.event);
		if (e.target) {
			var obj = e.target;

			var onBodyDown = function (event) {
				if (obj == event.target) {
					return;
				}
				$m.hide();
				$("body").unbind("click.vsCalendar", onBodyDown);
			};

			$("body").bind("click.vsCalendar", onBodyDown);
		}
	};

	// 设置日历的星期标题
	function setTitle() {
		var self = this;

		self.mTitle[0] = lang.aWeekStr[0];
		for (var i = 1; i <= 7; i++) {
			var j = self.options.firstDayOfWeek + i;
			if (j > 7) {
				j = j - 7;
			}
			self.mTitle[i] = lang.aWeekStr[j];
		}

		if (self.options.isShowWeek == false) {
			self.mTitle.splice(0, 1);
		}
	}

	// 按年份设置年份列表(每次获取10个年份)
	function setYearList(year) {
		var self = this;
		var curDate = self.curDate();
		if (year == undefined) {
			year = curDate.getFullYear();
		}

		var maxYear = (new Date(self.options.maxDate).getFullYear());
		var minYear = (new Date(self.options.minDate).getFullYear());

		if (year < minYear) {
			year = minYear;
		}
		if (year > maxYear) {
			year = maxYear;
		}

		var start = parseInt(year / 10) * 10;
		var mYear = [];
		var tmp;
		for (var i = 0; i < 10; i++) {
			if(i % 2== 0){
				tmp = [];
				mYear.push(tmp);
			}
			tmp.push({
				year: (start + i),
				yearStr: (start + i) + "年",
				isValid: (start + i) >= minYear && (start + i) <= maxYear
			});
		}

		self.mYear(mYear);
	}

	// 设置月份列表
	function setMonthList() {
		var self = this;

		var mMonth = [];
		var tmp;
		for (var i in lang.aLongMonStr) {
			if(i % 2== 0){
				tmp = [];
				mMonth.push(tmp);
			}
			tmp.push({
				month: i,
				monthStr: lang.aLongMonStr[i]
			});
		}

		self.mMonth(mMonth);
	}

	// 设置日历的当月时间表
	function setDateList() {
		var self = this;

		var curDay = self.curDate();

		var firstDay = new Date(curDay.getFullYear(), curDay.getMonth(), 1);
		var weekday = firstDay.getDay();
		var curMonth = firstDay.getMonth();
		var dw = self.options.firstDayOfWeek - weekday;
		var startDay = new Date(firstDay.getTime() + (dw > 0 ? dw - 7 : dw) * duration.day);

		var mDate = [];
		for (var i = 0; i < 6; i++) {
			var l = [];
			var d = {};
			if (self.options.isShowWeek == true) {
				var s = new Date(startDay.getTime() + i * 7 * duration.day);
				d = {
					isDate: false, // 是否日期
					wk: getWeekByDate.call(self, s), // 所属周次
					css: self.options.css.wweek,
					cssOn: self.options.css.wweek
				};
				l.push(d);
			}

			for (j = 0; j < 7; j++) {
				var tmp = new Date(startDay.getTime() + (i * 7 + j) * duration.day);
				d = {
					isDate: true, // 是否日期
					year: tmp.getFullYear(), // 所属年份
					month: tmp.getMonth(), // 所属月份
					date: tmp.getDate(), // 所属日期
					weekday: tmp.getDay(), // 所属星期
					isToday: getDateIsToday.call(self, tmp), // 日期是否今天
					isValidDay: getDateIsValid.call(self, tmp), // 日期是否有效
					isWkd: tmp.getDay() == 0 || tmp.getDay() == 6, // 是否周末
					isCurMonth: tmp.getMonth() == curMonth, // 是否当前月
					isCurDate: tmp.getFullYear() == curDay.getFullYear() && tmp.getMonth() == curDay.getMonth() && tmp.getDate() == curDay.getDate()  // 是否当前日期
				};

				if (d.isCurDate) {
					d.css = self.options.css.wselday;
					d.cssOn = self.options.css.wselday;
				} else if (d.isValidDay == false) {
					d.css = self.options.css.winvalidDay;
					d.cssOn = self.options.css.winvalidDay;
				} else if (d.isCurMonth == false) {
					d.css = self.options.css.wotherDay;
					d.cssOn = self.options.css.wotherDayOn;
				} else if (d.isToday) {
					d.css = self.options.css.wtoday;
					d.cssOn = self.options.css.wtoday;
				} else if (d.isWkd) {
					d.css = self.options.css.wwday;
					d.cssOn = self.options.css.wwdayOn;
				} else {
					d.css = self.options.css.wday;
					d.cssOn = self.options.css.wdayOn;
				}
				l.push(d);
			}

			mDate.push({
				week: l
			});
		}
		self.mDate(mDate);
	}

	// 设置小时列表
	function setHourList() {
		var self = this;

		var mHour = [];
		var tmp;
		for (var i in lang.aLongHourStr) {
			if( i % 6 == 0){
				tmp = [];
				mHour.push(tmp);
			}
			tmp.push({
				hour: i,
				hourStr: lang.aLongHourStr[i]
			});
		}

		self.mHour(mHour);
	}

	// 设置分钟列表
	function setMinList() {
		var self = this;

		var mMin = [];
		var tmp;
		var interval = 60 / lang.aLongMinStr.length;
		for (var i in lang.aLongMinStr) {
			if( i % 6 == 0){
				tmp = [];
				mMin.push(tmp);
			}
			tmp.push({
				min: i * interval,
				minStr: lang.aLongMinStr[i]
			});
		}

		self.mMin(mMin);
	}

	// 设置秒列表
	function setSecList() {
		var self = this;

		var mSec = [];
		var tmp;
		var interval = 60 / lang.aLongSecStr.length;
		for (var i in lang.aLongSecStr) {
			if( i % 6 == 0){
				tmp = [];
				mSec.push(tmp);
			}
			tmp.push({
				sec: i * interval,
				secStr: lang.aLongSecStr[i]
			});
		}

		self.mSec(mSec);
	}

	// 通过日期获取当前日期所在年的周次(WW)
	function getWeekByDate(date) {
		var self = this;
		var d = duration.day;

		var firstDateInYearWeek = getFirstDateInYearWeek.call(self, date.getFullYear());
		if (date < firstDateInYearWeek) {
			firstDateInYearWeek = getFirstDateInYearWeek.call(self, date.getFullYear() - 1);
		}

		var w = parseInt((date - firstDateInYearWeek) / (7 * d)) + 1;
		return w < 10 ? "0" + w : w;
	}

	// 通过日期获取当前日期所在年的周次(yyyyWW)
	function getYearWeekByDate(date) {
		var self = this;
		var d = duration.day;
		var year = date.getFullYear();
		var firstDateInYearWeek = getFirstDateInYearWeek.call(self, year);
		if (date < firstDateInYearWeek) {
			year = year - 1;
			firstDateInYearWeek = getFirstDateInYearWeek.call(self, year);
		}

		var w = parseInt((date - firstDateInYearWeek) / (7 * d)) + 1;
		return year.toString() + (w < 10 ? "0" + w : w).toString();
	}

	// 通过年份获取当前年第一周的第一天日期
	function getFirstDateInYearWeek(year) {
		var self = this;
		var d = duration.day;

		var firstDateInYear = new Date(year, 0, 1);
		var firstWeekInYear = firstDateInYear.getDay();

		var firstDate = 1;
		if (firstWeekInYear > self.options.firstDayOfWeek) {
			firstDate = self.options.firstDayOfWeek - firstWeekInYear + 7;
		} else if (firstWeekInYear < self.options.firstDayOfWeek) {
			firstDate = firstWeekInYear - self.options.firstDayOfWeek;
		}

		return new Date(year, 0, firstDate);
	}

	// 判断日期是否在有效日期范围内
	function getDateIsValid(date) {
		var self = this;

		var flag = false;
		var maxDate = new Date(self.options.maxDate);
		var minDate = new Date(self.options.minDate);
		if (date instanceof Date && date >= minDate && date <= maxDate) {
			flag = true;
		}
		return flag;
	}

	// 判断日期是否为今天
	function getDateIsToday(date) {
		var flag = false;
		var today = new Date();
		if (date instanceof Date && date.getFullYear() == today.getFullYear() && date.getMonth() == today.getMonth() && date.getDate() == today.getDate()) {
			flag = true;
		}

		return flag;
	}

	// 将日期按指定格式输出
	function date2str(date, fmt) {
		if (date instanceof Date) {
			var z = {
				M: date.getMonth() + 1,
				d: date.getDate(),
				H: date.getHours(),
				m: date.getMinutes(),
				s: date.getSeconds()
			};
			fmt = fmt.replace(/(M+|d+|H+|m+|s+)/g, function (v) {
				return ((v.length > 1 ? "0" : "") + eval('z.' + v.slice(-1))).slice(-2);
			});
			return fmt.replace(/(y+)/g, function (v) {
				return date.getFullYear().toString().slice(-v.length);
			});
		} else {
			return "";
		}
	}

	function strToDate(dateStr) {
		dateStr = dateStr.replace(/-/g, '/');
		return new Date(dateStr);
	}

	$ko.bindingHandlers.vsCalendar = {
		init: function (element, valueAccessor, allBindingsAccessor, viewModel,
			bindingContext) {

			var accessor = valueAccessor();
			accessor.el = element;
			element.style.display = "none";

			while (element.firstChild)
				$ko.removeNode(element.firstChild);

			var templateName = allBindingsAccessor.get('calendarTemplate');
			var container = element.appendChild(document.createElement("DIV"));
			$ko.renderTemplate(templateName, accessor, {}, container, "replaceNode");

			return {
				controlsDescendantBindings: true
			};
		},

		update: function (element, valueAccessor, allBindingsAccessor,
			viewModel, bindingContext) {
		}
	};
})(window, document, jQuery, ko);
/**
 * ========================================================================
 * vsPage --分页控件 依赖jQuery,ko
 * ========================================================================
 */
(function(window, document, $, $ko, undefined) {
	// 默认配置
	var defaults = {
		pageSize : 20, // 每页的数据量
		pages : [ 10, 20, 50, 100 ],
		pageChanged : null
	};

	$ko.vsPage = {
		ViewModel : function(opt) {
			var self = this;

			self.options = $.extend(true, {}, defaults, opt);

			self.totalCount = $ko.observable(0);
			self.pageSize = $ko.observable(self.options.pageSize);
			self.pages = $ko.observableArray(self.options.pages);
			self.currentPageIndex = $ko.observable(1);
			self.jumpPage = $ko.observable("");

			// 最大分页索引
			self.maxPageIndex = $ko.computed(function() {
				return Math.ceil($ko.unwrap(self.totalCount) / $ko.unwrap(self.pageSize));
			}, self);

			// 是否有上一页
			self.canPrev = $ko.computed(function() {
				return $ko.unwrap(self.currentPageIndex) > 1;
			}, self);

			// 是否有下一页
			self.canNext = $ko.computed(function() {
				return $ko.unwrap(self.currentPageIndex) < $ko
						.unwrap(self.maxPageIndex);
			}, self);

			// 跳转到第一页
			self.goFirst = function() {
				pageChanging.call(self, 1, false);
			};

			// 跳转到上一页
			self.goPrev = function() {
				var index = parseInt($ko.unwrap(self.currentPageIndex), 10) - 1;
				pageChanging.call(self, index, false);
			};

			// 跳转到最后一页
			self.goLast = function() {
				var index = $ko.unwrap(self.maxPageIndex);
				pageChanging.call(self, index, false);
			};

			// 跳转到下一页
			self.goNext = function() {
				var index = parseInt($ko.unwrap(self.currentPageIndex), 10) + 1;
				pageChanging.call(self, index, false);
			};

			// 跳转到指定页
			self.jump = function() {
				var r = /^[0-9]*[1-9][0-9]*$/;
				var index = $ko.unwrap(self.jumpPage);
				var maxPageIndex = $ko.unwrap(self.maxPageIndex);

				if (r.test(index)) {
					if (index < 1) {
						index = 1;
					} else if (index > maxPageIndex) {
						index = maxPageIndex;
					}
					pageChanging.call(self, index, false);
				} else {
					alert('请输入数字');
				}
				self.jumpPage('');
			};

			// 每页数据量发生变化后的事件
			self.pageSizeChanged = function() {
				pageChanging.call(self, 1, true);
			};
		}
	};

	// 分页发生变化时
	function pageChanging(index, isChangeSize) {
		var self = this;

		var maxPageIndex = $ko.unwrap(self.maxPageIndex);
		var size = $ko.unwrap(self.pageSize);

		if (index > maxPageIndex) {
			index = maxPageIndex;
		}

		if (index < 1) {
			index = 1;
		}

		if (isChangeSize == false) {
			var currentPageIndex = $ko.unwrap(self.currentPageIndex);
			if (index == currentPageIndex) {
				return;
			}
		}

		if (self.options.pageChanged) {
			self.options.pageChanged(index, size);
		}
	}

	$ko.bindingHandlers.vsPage = {
		init : function(element, valueAccessor, allBindingsAccessor, viewModel,
				bindingContext) {
			var accessor = valueAccessor();
			accessor.el = element;

			while (element.firstChild)
				$ko.removeNode(element.firstChild);

			var pageLinksTemplateName = allBindingsAccessor
					.get('pageTemplate');
			var pageLinksContainer = element.appendChild(document
					.createElement("DIV"));
			$ko.renderTemplate(pageLinksTemplateName, accessor, {},
					pageLinksContainer, "replaceNode");

			return {
				controlsDescendantBindings : true
			};
		},
		update : function(element, valueAccessor, allBindingsAccessor,
				viewModel, bindingContext) {
		}
	};
})(window, document, jQuery, ko);
/**
 * ========================================================================
 * vsGrid --表格控件(待完善) 依赖jQuery,ko,vsPage,vsMask
 * ========================================================================
 */
(function(window, document, $, $ko, undefined) {
	var defaults = {
		url : "",
		type : "post",
		joinChar : ",",
		idKey: "id",
		frozen_headers : [ [] ],
		frozen_columns : [],
		headers : [ [] ],
		columns : [],
		rowOpts : [],
		rowStyle : "bg",
		alternatingRowStyle : "alterbg",
		selectRowStyle: "selectbg",
		isInitLoad : true,
		query : {},
		completeFn : null,
		pageSize : 20, // 每页的数据量
		pages : [ 10, 20, 50, 100 ] // 下拉选项中的每页的数据量
	};

	var header_defaults = {
		title : "",
		align : "center",
		rowspan : 1,
		colspan : 1,
		width : "auto",
		checkbox : false,
		formatter : null
	};

	var column_defaults = {
		field : "",
		align : "left",
		width : "auto",
		checkbox : false,
		radio : false,
		options : [],
		formatter : null
	};

	$ko.vsGrid = {
		ViewModel : function(opt) {
			var self = this;
			self.options = $.extend(true, {}, defaults, opt);
			// 继承分页控件
			$ko.vsPage.ViewModel.call(self, self.options);

			var i, j;
			for (i = 0; i < self.options.headers.length; i++) {
				for (j = 0; j < self.options.headers[i].length; j++) {
					self.options.headers[i][j] = $.extend(true, {},
							header_defaults, self.options.headers[i][j]);
				}
			}
			for (i = 0; i < self.options.frozen_headers.length; i++) {
				for (j = 0; j < self.options.frozen_headers[i].length; j++) {
					self.options.frozen_headers[i][j] = $.extend(true, {},
							header_defaults, self.options.frozen_headers[i][j]);
				}
			}
			for (i = 0; i < self.options.columns.length; i++) {
				self.options.columns[i] = $.extend({}, column_defaults,
						self.options.columns[i]);
			}
			for (i = 0; i < self.options.frozen_columns.length; i++) {
				self.options.frozen_columns[i] = $.extend({}, column_defaults,
						self.options.frozen_columns[i]);
			}

			self.data = $ko.observableArray([]);
			self.checkItems = $ko.observable([]);
			self.query = $ko.observable(self.options.query);

			self.options.pageChanged = function(index, size) {
				loadData.call(self, index, size, self.query());
			};
		}
	};

	// 数据加载
	$ko.vsGrid.ViewModel.prototype.reload = function(opt) {
		var self = this;
		self.options = $.extend(true, {}, self.options, opt);
		self.pageSizeChanged();
	};

	$ko.vsGrid.ViewModel.prototype.getRowStyle = function(tr, data) {
		var self = this;

		var css = (tr.rowIndex % 2 == 1 ? self.options.rowStyle
				: self.options.alternatingRowStyle);

		var items = self.checkItems();
		var idKey = self.options.idKey;
		for(var i=0; i<items.length; i++) {
			if(items[i] == data[idKey]) {
				css = self.options.selectRowStyle;
			}
		}

		return css;
	};

	$ko.vsGrid.ViewModel.prototype.checkAll = function(cb) {
		var self = this;
		var flag = $(cb).prop("checked");
		var chbs = $("input[name='" + cb.name + "']", self.el);
		var items = [];
		chbs.each(function() {
			var chb = $(this);
			if(flag == true && chb.val() != ''){
				items.push(chb.val());
			}
			chb.prop("checked", flag);
		});
		self.checkItems(items);
	};

	$ko.vsGrid.ViewModel.prototype.check = function(cb) {
		var self = this;
		var chbs = $("input[name='" + cb.name + "']", self.el);
		var items = [];
		chbs.each(function() {
			var chb = $(this);
			var flag = chb.prop("checked");
			if(flag == true && chb.val() != ''){
				items.push(chb.val());
			}
		});
		self.checkItems(items);
	};

	$ko.vsGrid.ViewModel.prototype.getCheckedData = function(s) {
		var self = this;
		var checkItems = self.checkItems();
		if (s == undefined) {
			s = self.options.joinChar;
		}
		return checkItems.join(s);
	};

	$ko.vsGrid.ViewModel.prototype.getCheckedRow = function() {
		var self = this;
		var items = self.checkItems();
		var data = self.data();
		var idKey = self.options.idKey;

		var rows = [];
		for(var i=0; i < data.length; i++){
			for(j=0; j < items.length; j++){
				if(items[j] == data[i][idKey]){
					rows.push(data[i]);
					break;
				}
			}
		}
		return rows;
	};

	function loadData(index, size, q) {
		var self = this;
		var result = {
			success : false,
			message : "数据加载失败",
			list : [],
			total : 0
		};

		self.checkItems([]);
		$("input[type='checkbox']", self.el).prop("checked", false);
		$("input[type='radio']", self.el).prop("checked", false);

		var params = $ko.toJSON({
			model : q,
			pageIndex : index,
			pageSize : size
		});

		$.ajax({
			url : self.options.url,
			type : self.options.type,
			contentType : "application/json",
			data : self.options.type == "get" ? $.parseJSON(params) : params,
			dataType : "json",
			beforeSend : function() {
				showMask.call(self);
			},
			complete : function() {
				closeMask.call(self);

				self.data.removeAll();
				if (result.success == false) {
					alert(result.message);
				} else if (result.list != null) {
					for (var i = 0; i < result.list.length; i++) {
						self.data.push(result.list[i]);
					}
				}
				if (result.total == 0) {
					index = 1;
				}

				self.totalCount(result.total);
				self.currentPageIndex(index);
				
				if(self.options.completeFn != null){
					self.options.completeFn(result);
				}
			},
			success : function(d) {
				result = d;
			}
		});
	}

	function showMask() {
		var self = this;
		$(self.el).vsMask().showMask();
	}

	function closeMask() {
		var self = this;
		$(self.el).vsMask().closeMask();
	}

	$ko.bindingHandlers.vsGrid = {
		init : function(element, valueAccessor, allBindingsAccessor, viewModel,
				bindingContext) {

			var accessor = valueAccessor();
			accessor.el = element;

			while (element.firstChild)
				$ko.removeNode(element.firstChild);

			var gridTemplateName = allBindingsAccessor.get('gridTemplate');
			var pageTemplateName = allBindingsAccessor.get('pageTemplate');

			var gridContainer = element.appendChild(document
					.createElement("DIV"));
			$ko.renderTemplate(gridTemplateName, accessor, {}, gridContainer,
					"replaceNode");

			if (pageTemplateName != null) {
				var pageContainer = element.appendChild(document
						.createElement("DIV"));
				$ko.renderTemplate(pageTemplateName, accessor, {},
						pageContainer, "replaceNode");
			}

			if (accessor.options.isInitLoad == true) {
				accessor.reload.call(accessor);
			}

			return {
				controlsDescendantBindings : true
			};
		},

		update : function(element, valueAccessor, allBindingsAccessor,
				viewModel, bindingContext) {
		}
	};
})(window, document, jQuery, ko);
/**
 * ========================================================================
 * vsAutoComplete --输入框自动完成功能 依赖jQuery,ko,vsPage
 * ========================================================================
 */
(function(window, document, $, $ko, undefined) {
	// 默认配置
	var defaults = {
		width : "auto",
		url : "",
		searchKey : "name",
		selectKey : "name",
		loaderFn: null,
		confirmFn: null,
		renderFn : null,
		selectFn : null,
		pageSize : 10,
		pagination: true,
		"z-index" : 10000
	};

	var KEY = {
		UP : 38,
		DOWN : 40,
		DEL : 46,
		TAB : 9,
		RETURN : 13,
		ESC : 27,
		COMMA : 188,
		PAGEUP : 33,
		PAGEDOWN : 34,
		BACKSPACE : 8
	};

	$ko.vsAutoComplete = {
		// 构造函数
		ViewModel : function(opt) {
			var self = this;
			self.options = $.extend(true, {}, defaults, opt); // 配置项
			// 继承分页控件
			$ko.vsPage.ViewModel.call(self, self.options);
			
			self.keySelect = $ko.observable(-1); // 键盘选择
			self.searchValue = $ko.observable(""); // 查询值
			self.selectItem = $ko.observable(); //查询对象
			self.sourceData = $ko.observableArray([]); // 查询源数据
			
			self.options.pageChanged = function(index, size) {
				loadData.call(self, index, size);
			};
			
			// 当输入框的值发生变化时，响应的事件
			self.searchValue.subscribe(function(v) {
				v = $.trim(v);
				self.keySelect(-1);
				if (v.length <= 0) {
					self.sourceData([]);
				} else {
					self.pageSizeChanged();
				}
				
				if (self.options.selectFn != null) {
					self.options.selectFn();
				}
			});

		}
	};

	// 显示
	$ko.vsAutoComplete.ViewModel.prototype.show = function(event) {
		var self = this;

		var e = $.event.fix(event || window.event);
		if (e.target) {
			self.keySelect(-1);
			
			var obj = e.target;
			var $obj = $(obj);
			var $obj_offset = $obj.offset();
			var $el = $(self.el);
			$el.css({
				left : $obj_offset.left + "px",
				top : $obj_offset.top + $obj.outerHeight() + "px",
				position : "absolute",
				"z-index" : self.options["z-index"]
			}).slideDown("fast");


			var onBodyDown = function (event) {
				if (obj == event.target || event.target.id == self.el.id || $(event.target).parents("#" + self.el.id).length > 0) {
					return;
				}

				self.close();
				$("body").unbind("click.vsAutoComplete", onBodyDown);
			};
			$("body").bind("click.vsAutoComplete", onBodyDown);
		}
	};
	
	$ko.vsAutoComplete.ViewModel.prototype.keypress = function(event){
		var self = this;

		var e = $.event.fix(event || window.event);
		var select = self.keySelect();
		var total = self.sourceData().length;
		switch (e.keyCode) {
		case KEY.UP:
			select--;
			if (select < 0) {
				select = total-1;
			}
			break;
		case KEY.DOWN:
			select++;
			if (select >= total) {
				select = 0;
			}
			break;
		case KEY.RETURN:
			event.target.blur();
			self.confirm(self.sourceData()[select]);
			break;
		}
		self.keySelect(select);
	};

	// 关闭
	$ko.vsAutoComplete.ViewModel.prototype.close = function() {
		var self = this;
		$(self.el).fadeOut("fast");
	};

	$ko.vsAutoComplete.ViewModel.prototype.confirm = function(item) {
		var self = this;
		var key = self.options.selectKey;
		
		self.keySelect(-1);
		self.searchValue(item[key]);
		self.selectItem(item);
		self.close();
		
		if (self.options.confirmFn) {
			self.options.confirmFn();
		}
	};
	
	$ko.vsAutoComplete.ViewModel.prototype.render = function(item) {
		var self = this;
		
		if(self.options.renderFn == null){
			return item[self.options.selectKey];
		} else {
			return self.options.renderFn(item);
		}
	};

	$ko.vsAutoComplete.ViewModel.prototype.clear = function() {
		var self = this;
		self.sourceData([]);
		self.keySelect(-1);
		self.searchValue("");
		self.selectItem(null);
		self.currentPageIndex(1);
		self.close();
	};

	function loadData(index, size) {
		var self = this;
		
		var result = {
			success : false,
			message : "数据加载失败",
			list : [],
			total : 0
		};
		
		var params = {
			model : {},
			pageIndex : index,
			pageSize : size
		};
		var key = self.options.searchKey;
		var value = self.searchValue();
		params.model[key] = value;

		if(self.options.loaderFn != null){
			params = self.options.loaderFn(params);
		}
		
		$.ajax({
			url : self.options.url,
			type : "post",
			contentType : "application/json",
			dataType : "json",
			data : $ko.toJSON(params),
			complete : function() {
				self.sourceData.removeAll();
				if (result.success == false) {
					alert(result.message);
				} else if (result.list != null) {
					for (var i = 0; i < result.list.length; i++) {
						self.sourceData.push(result.list[i]);
					}
				}
				if (result.total == 0) {
					index = 1;
				}

				self.totalCount(result.total);
				self.currentPageIndex(index);
			},
			success : function(d) {
				result = d;
			}
		});
	}

	$ko.bindingHandlers.vsAutoComplete = {
		init : function(element, valueAccessor, allBindingsAccessor, viewModel,
				bindingContext) {

			var accessor = valueAccessor();
			accessor.el = element;

			while (element.firstChild)
				$ko.removeNode(element.firstChild);

			var templateName = allBindingsAccessor.get('autoCompleteTemplate');
			
			var container = element.appendChild(document.createElement("DIV"));
			$ko.renderTemplate(templateName, accessor, {}, container,
					"replaceNode");
			
			return {
				controlsDescendantBindings : true
			};
		},

		update : function(element, valueAccessor, allBindingsAccessor,
				viewModel, bindingContext) {

		}
	};
})(window, document, jQuery, ko );
/**
 * ========================================================================
 * vsTreeSelector --树选择控件(支持单选和多选)
 * 依赖jQuery,ko,jquery.ztree.core,jquery.ztree.excheck
 * ========================================================================
 */
(function(window, document, $, $ko, undefined) {
	// 默认配置,和ztree配置相同
	var defaults = {
		memberIdValues : [], // 初始化已选成员节点的唯一标识集合
		selectKey : "name",
		joinChar : ",",
		confirmFn : null,
		selectFn : null,
		data: null,
		ztree_setting : {
			check : {
				enable : true,
				chkboxType : {
					"Y" : "",
					"N" : ""
				}, // "Y": "ps", "N": "ps"
				chkStyle : "checkbox", // checkbox,radio
				radioType : "all" // level,all
			},
			async : {
				url : "",
				enable : true,
				type : "post",
				contentType : "application/json",
				dataType : "json",
				cache : false
			},
			data : {
				key : {
					name : "name",
					checked : "isChecked"
				},
				simpleData : {
					enable : true,
					idKey : "id",
					pIdKey : "parentId",
					rootPId : null
				}
			}
		}
	};

	$ko.vsTreeSelector = {
		// 构造函数
		ViewModel : function(opt) {
			var self = this;

			// 类属性
			self.options = $.extend(true, {}, defaults, opt); // 配置项
			self.ztree = null; // 树控件
			self.sourceData = $ko.observableArray([]); // 勾选的数据
			self.canShow = $ko.observable(false); // 是否能够显示控件,在树控件还没加载时，不能显示.
			self.isLoadingTree = $ko.observable(false); // 树控件加载数据状态
			self.getSelectDataStr = $ko.computed(function() {
				return self.getSelectData(self.options.selectKey);
			}, self);
		}
	};

	// 显示选择控件
	$ko.vsTreeSelector.ViewModel.prototype.show = function(event) {
		var self = this;
		
		if (self.canShow() == false) {
			return;
		}

		if (!self.ztree) {
			self.ztree = createTree.call(self);
		} else {
			var nodes = self.ztree.getNodes();
			if (nodes.length == 0) {
				self.ztree.reAsyncChildNodes(null, "refresh");
			}
		}

		var e = $.event.fix(event || window.event);
		if (e.target) {
			var obj = e.target;
			var $obj = $(obj);
			var $obj_offset = $obj.offset();
			var $el = $(self.el);
			$el.css({
				left : $obj_offset.left + "px",
				top : $obj_offset.top + $obj.outerHeight() + "px",
				"z-index" : 10000,
				position : "absolute"
			}).slideDown("fast");

			var onBodyDown = function (event) {
				if (obj == event.target || event.target.id == self.el.id || $(event.target).parents("#" + self.el.id).length > 0) {
					return;
				}

				self.close();
				$("body").unbind("click.vsTreeSelector", onBodyDown);
			};

			$("body").bind("click.vsTreeSelector", onBodyDown);
		}
	};

	// 关闭选择控件
	$ko.vsTreeSelector.ViewModel.prototype.close = function() {
		var self = this;
		$(self.el).fadeOut("fast");
		if (self.options.confirmFn) {
			self.options.confirmFn();
		}
	};

	// 获取选择的数据项(可通过属性名称获取，也可以获取整个数据对象集合),并用指定字符拼接（默认用逗号）
	$ko.vsTreeSelector.ViewModel.prototype.getSelectData = function(arg, s) {
		var self = this;
		var sourceData = self.sourceData();
		if (typeof arg === "string" && sourceData != undefined) {
			var data = [];
			for (var index in sourceData) {
				data.push(sourceData[index][arg]);
			}
			if(s == "array"){
				return data;
			}
			if (s == undefined) {
				s = self.options.joinChar;
			}
			return data.join(s);
		}
		return sourceData;
	};

	// 重新加载数据
	// opt: 配置项
	// isRefreshTree: 是否更新树,默认不更新
	$ko.vsTreeSelector.ViewModel.prototype.reload = function(opt, isRefreshTree) {
		var self = this;

		if (opt) {
			self.options.memberIdValues = [];
			self.options = $.extend(true, {}, defaults, self.options, opt);
		}

		self.sourceData([]);

		if (self.ztree) {
			
			self.ztree.checkAllNodes(false);
			var checkedNodes = self.ztree.getCheckedNodes(true);
			if(checkedNodes.length > 0){
				for(var i = 0; i<checkedNodes.length; i++ ){
					self.ztree.checkNode(checkedNodes[i], false, false);
				}
			}
			self.ztree.cancelSelectedNode();
			self.ztree.expandAll(false);
			
			if (isRefreshTree != undefined && isRefreshTree == true) {
				self.ztree.reAsyncChildNodes(null, "refresh");
			} else {
				if (self.options.memberIdValues.length > 0) {
					checkedNode.call(self);
				}
			}
		} else {
			self.ztree = createTree.call(self);
			if (self.options.memberIdValues.length > 0) {
				checkedNode.call(self);
			}
		}
	};

	// 创建树控件
	function createTree() {
		var self = this;

		var setting = $.extend(true, {}, {
			callback : {
				onClick : function(event, treeId, treeNode, clickFlag) {

				},
				onCheck : function(event, treeId, treeNode) {
					var checkedNodes = self.ztree.getCheckedNodes(true);
					self.sourceData(checkedNodes);
					
					if(self.options.selectFn){
						self.options.selectFn();
					}
				},
				beforeAsync : function(treeId, treeNode) {
					if (self.isLoadingTree() == true) {
						return false;
					}
					self.isLoadingTree(true);
					return true;
				},
				onAsyncSuccess : function(event, treeId, treeNode, msg) {
					self.isLoadingTree(false);
					self.canShow(true);

					checkedNode.call(self);
				},
				onAsyncError : function(event, treeId, treeNode,
						XMLHttpRequest, textStatus, errorThrown) {
					self.isLoadingTree(false);
					self.canShow(true);
				}
			}
		}, self.options.ztree_setting);

		if(self.options.data == null){
			return $.fn.zTree.init($("#" + self.treeId), setting);
		}else{
			self.canShow(true);
			return $.fn.zTree.init($("#" + self.treeId), setting, self.options.data);
		}
		
	}

	// 勾选节点
	function checkedNode() {
		var self = this;

		var key = self.options.ztree_setting.data.simpleData.idKey;
		var values = self.options.memberIdValues;
		for ( var i in values) {
			var node = self.ztree.getNodeByParam(key, values[i]);
			if (node) {
				self.ztree.checkNode(node, true, false);
			}
		}

		var checkedNodes = self.ztree.getCheckedNodes(true);
		self.sourceData(checkedNodes);
	}

	$ko.bindingHandlers.vsTreeSelector = {
		init : function(element, valueAccessor, allBindingsAccessor, viewModel,
				bindingContext) {

			var accessor = valueAccessor();
			accessor.el = element;
			accessor.treeId = element.id + "_tree";
			element.style.display = "none";

			while (element.firstChild)
				$ko.removeNode(element.firstChild);

			var templateName = allBindingsAccessor.get('treeSelectorTemplate');
			var container = element.appendChild(document.createElement("DIV"));
			$ko.renderTemplate(templateName, accessor, {}, container,
					"replaceNode");

			// 如果有默认值，则创建树
			accessor.ztree = createTree.call(accessor);

			return {
				controlsDescendantBindings : true
			};
		},

		update : function(element, valueAccessor, allBindingsAccessor,
				viewModel, bindingContext) {

		}
	};
})(window, document, jQuery, ko);
/**
 * ========================================================================
 * vsMemberSelector --成员选择控件 依赖jQuery,ko
 * ========================================================================
 */
(function(window, document, $, $ko, undefined) {

	// 默认配置
	var defaults = {
		memberUrl : "", // 请求成员的url
		memberIdKey : "id", // 成员节点唯一标识字段
		memberNameKey : "name", // 成员节点名称字段
		memberIdValues : [], // 初始化已选成员节点的唯一标识集合
		memberSearchKey : ["name"], // 模糊查询成员节点字段
		memberQuery: {},
		joinChar : ",",
		// 浮动窗口的默认配置
		vsWin_setting : {
			persist : true
		}
	};

	$ko.vsMemberSelector = {
		// 构造函数
		ViewModel : function(opt) {
			var self = this;

			// 类属性
			self.options = $.extend(true, {}, defaults, opt); // 配置项
			self.vsWin = null; // 浮动窗口控件
			self.searchValue = $ko.observable(""); // 查询值
			self.rawSourceData = $ko.observableArray([]); // 待选区原始数据
			self.rawTargetData = $ko.observableArray([]); // 已选区原始数据
			self.sourceData = $ko.observableArray([]); // 待选区数据
			self.targetData = $ko.observableArray([]); // 已选区数据

			self.selectSource = $ko.observableArray([]); // 选择的待选成员
			self.selectTarget = $ko.observableArray([]); // 选择的已选成员

			// 当输入框的值发生变化时，响应的事件
			self.searchValue.subscribe(function(v) {
				loadSourceData.call(self);
			});

			loadSourceData.call(self);
			loadTargetData.call(self);
		}
	};

	// 显示组织成员选择控件
	$ko.vsMemberSelector.ViewModel.prototype.show = function() {
		var self = this;

		var targetData0 = self.rawTargetData();
		self.targetData(targetData0);
		loadSourceData.call(self);

		if (!self.vsWin) {
			$(self.el).show();
		} else {
			self.vsWin.open();
		}
	};

	// 关闭组织成员选择控件
	$ko.vsMemberSelector.ViewModel.prototype.close = function() {
		var self = this;

		if (!self.vsWin) {
			$(self.el).hide();
		} else {
			self.vsWin.close();
		}
	};

	// 确认选择的人员
	$ko.vsMemberSelector.ViewModel.prototype.confirm = function() {
		var self = this;

		if (!self.vsWin) {
			$(self.el).hide();
		} else {
			self.vsWin.close();
		}

		var targetData0 = self.targetData();
		self.rawTargetData(targetData0);
	};

	// 获取选择的数据项(可通过属性名称获取，也可以获取整个数据对象集合),并用指定字符拼接（默认用逗号）
	// arg: 属性名称
	// s: 数据拼接符
	$ko.vsMemberSelector.ViewModel.prototype.getSelectData = function(arg, s) {
		var self = this;
		var targetData0 = self.rawTargetData();
		if (typeof arg === "string" && targetData0 != undefined) {
			var data = [];
			for (var index in targetData0) {
				data.push(targetData0[index][arg]);
			}
			if(s == "array"){
				return data;
			}
			if (s == undefined) {
				s = self.options.joinChar;
			}
			return data.join(s);
		}
		return targetData0;
	};

	// 移动单个成员，从待选区到已选区
	$ko.vsMemberSelector.ViewModel.prototype.move = function() {
		var self = this;
		var key = self.options.memberIdKey;

		var moveItems = self.selectSource();
		var sourceData0 = self.sourceData();
		var targetData0 = self.targetData();

		// 将移动项从待选区移除
		var sourceData1 = $.grep(sourceData0, function(n, i) {
			for (var j = 0; j < moveItems.length; j++) {
				if (n[key] == moveItems[j]) {
					return false;
				}
			}
			return true;
		});
		self.sourceData(sourceData1);

		// 将移动项添加到已选区
		var sourceData2 = $.grep(sourceData0, function(n, i) {
			for (var j = 0; j < moveItems.length; j++) {
				if (n[key] == moveItems[j]) {
					return false;
				}
			}
			return true;
		}, true);
		var addTargetData = [];
		$.each(sourceData2, function(i, n) {
			var isExist = false;
			$.each(targetData0, function(j, m) {
				if (n[key] == m[key]) {
					isExist = true;
					return false;
				}
			});
			if (!isExist) {
				addTargetData.push(n);
			}
		});
		self.targetData(addTargetData.concat(targetData0));
	};

	// 移动全部成员，从待选区到已选区
	$ko.vsMemberSelector.ViewModel.prototype.moveAll = function() {
		var self = this;
		var key = self.options.memberIdKey;

		var sourceData0 = self.sourceData();
		var targetData0 = self.targetData();

		// 将移动项从待选区移除
		self.sourceData([]);

		// 将移动项添加到已选区
		var addTargetData = [];
		$.each(sourceData0, function(i, n) {
			var isExist = false;
			$.each(targetData0, function(j, m) {
				if (n[key] == m[key]) {
					isExist = true;
					return false;
				}
			});
			if (!isExist) {
				addTargetData.push(n);
			}
		});
		self.targetData(addTargetData.concat(targetData0));
	};

	// 移除单个成员，从已选区到待选区
	$ko.vsMemberSelector.ViewModel.prototype.remove = function() {
		var self = this;
		var key = self.options.memberIdKey;

		var removeItems = self.selectTarget();
		var sourceData0 = self.sourceData();
		var targetData0 = self.targetData();

		// 将移除项从已选区移除
		var targetData1 = $.grep(targetData0, function(n, i) {
			for (var j = 0; j < removeItems.length; j++) {
				if (n[key] == removeItems[j]) {
					return false;
				}
			}
			return true;
		});
		self.targetData(targetData1);

		// 将移除项添加到待选区
		var targetData2 = $.grep(targetData0, function(n, i) {
			for (var j = 0; j < removeItems.length; j++) {
				if (n[key] == removeItems[j]) {
					return false;
				}
			}
			return true;
		}, true);
		var addSourceData = [];
		$.each(targetData2, function(i, n) {
			var isExist = false;
			$.each(sourceData0, function(j, m) {
				if (n[key] == m[key]) {
					isExist = true;
					return false;
				}
			});
			if (!isExist) {
				addSourceData.push(n);
			}
		});
		self.sourceData(addSourceData.concat(sourceData0));
	};

	// 移除全部成员，从已选区到待选区
	$ko.vsMemberSelector.ViewModel.prototype.removeAll = function() {
		var self = this;
		var key = self.options.memberIdKey;

		var sourceData0 = self.sourceData();
		var targetData0 = self.targetData();

		// 将移除项从已选区移除
		self.targetData([]);

		// 将移除项添加到待选区
		var addSourceData = [];
		$.each(targetData0, function(i, n) {
			var isExist = false;
			$.each(sourceData0, function(j, m) {
				if (n[key] == m[key]) {
					isExist = true;
					return false;
				}
			});
			if (!isExist) {
				addSourceData.push(n);
			}
		});
		self.sourceData(addSourceData.concat(sourceData0));
	};

	// 重新加载数据
	// opt: 配置项
	$ko.vsMemberSelector.ViewModel.prototype.reload = function(opt) {
		var self = this;

		if (opt) {
			self.options.memberIdValues = [];
			self.options = $.extend(true, {}, defaults, self.options, opt);
		}

		self.searchValue("");
		self.rawTargetData([]);
		self.targetData([]);
		self.selectSource([]);
		self.selectTarget([]);

		loadSourceData.call(self);
		loadTargetData.call(self);
	};

	// 创建浮动窗口控件
	function createWin() {
		var self = this;
		var $el = $(self.el);

		var setting = $.extend(true, {}, {
			onOpen : function() {
				$el.show();
			},
			onClose : function() {
				$el.hide();
			}
		}, self.options.vsWin_setting);

		var vsWin = new $ko.vsWin.ViewModel(setting);
		vsWin.el = self.el;
		$el.hide();

		return vsWin;
	}

	// 加载待选成员数据
	function loadSourceData() {
		var self = this;

		var rawSourceData = self.rawSourceData();
		if (rawSourceData.length == 0) {
			load.call(self);
		}
		rawSourceData = self.rawSourceData();

		var s = self.searchValue();
		var sourceData = [];
		if (s == "") {
			sourceData = rawSourceData;
		} else {
			var keys = self.options.memberSearchKey;
			for (var i = 0; i < rawSourceData.length; i++) {
				for(var j=0; j<keys.length; j++){
					if (rawSourceData[i][keys[j]].indexOf(s) >= 0) {
						sourceData.push(rawSourceData[i]);
						break;
					}
				}
				
			}
		}
		self.sourceData(sourceData);
	}

	// 加载默认已选成员数据
	function loadTargetData() {
		var self = this;
		var memberIdValues = self.options.memberIdValues;

		self.rawTargetData([]);
		self.targetData([]);

		if (memberIdValues.length == 0) {
			return;
		}

		var key = self.options.memberIdKey;

		var sourceData = self.rawSourceData();
		var targetData = [];
		for (var i = 0; i < sourceData.length; i++) {
			if ($.inArray(sourceData[i][key], memberIdValues) >= 0) {
				targetData.push(sourceData[i]);
			}
		}
		self.rawTargetData(targetData);
		self.targetData(targetData);
	}

	function load() {
		var self = this;

		$.ajax({
			url : self.options.memberUrl,
			type : "post",
			contentType : "application/json",
			data : JSON.stringify(self.options.memberQuery),
			dataType : "json",
			success : function(d) {
				self.rawSourceData(d.list);
				self.sourceData(d.list);
			},
			error : function() {
				alert("数据加载失败");
			}
		});
	}

	$ko.bindingHandlers.vsMemberSelector = {
		init : function(element, valueAccessor, allBindingsAccessor, viewModel,
				bindingContext) {

			var accessor = valueAccessor();
			accessor.el = element;

			while (element.firstChild) {
				$ko.removeNode(element.firstChild);
			}

			var templateName = allBindingsAccessor
					.get('memberSelectorTemplate');
			var container = element.appendChild(document.createElement("DIV"));
			$ko.renderTemplate(templateName, accessor, {}, container,
					"replaceNode");

			accessor.vsWin = createWin.call(accessor);

			return {
				controlsDescendantBindings : true
			};
		},

		update : function(element, valueAccessor, allBindingsAccessor,
				viewModel, bindingContext) {

		}
	};
})(window, document, jQuery, ko);
/**
 * ========================================================================
 * vsTeamMemberSelector --组织成员选择控件(多选) 依赖jQuery,ko,jquery.ztree.core
 * ========================================================================
 */
(function(window, document, $, $ko, undefined) {
	// 默认配置
	var defaults = {
		memberUrl : "", // 请求成员的url
		teamIdKey : "fkOrgId", // 所属组织字段
		memberIdKey : "id", // 成员节点唯一标识字段
		memberIdValues : [], // 初始化已选成员节点的唯一标识集合
		memberNameKey : "name", // 模糊查询成员节点字段
		selectKey : "name",
		loaderSourceFn: null,
		loaderTargetFn: null,
		renderFn: null,
		confirmFn : null,
		joinChar : ",",
		data: null,

		// 树控件的默认配置
		ztree_setting : {
			async : {
				url : "", // 请求树数据的url
				enable : true,
				type : "post",
				contentType : "application/json",
				dataType : "json",
				cache : false
			},
			data : {
				key : {
					name : "name" // 组织节点名称标识字段
				},
				simpleData : {
					enable : true, // 开启简单数据模式
					idKey : "id", // 组织节点唯一标识字段
					pIdKey : "parentId", // 组织父节点唯一标识字段
					rootPId : "0" // 组织根节点的值
				}
			}
		},

		// 浮动窗口的默认配置
		vsWin_setting : {
			persist : true
		}
	};

	$ko.vsTeamMemberSelector = {
		// 构造函数
		ViewModel : function(opt) {
			var self = this;

			// 类属性
			self.options = $.extend(true, {}, defaults, opt); // 配置项
			self.ztree = null; // 树控件
			self.vsWin = null; // 浮动窗口控件
			self.searchValue = $ko.observable(""); // 查询值
			self.rawSourceData = $ko.observableArray([]); // 待选区原始数据
			self.rawTargetData = $ko.observableArray([]); // 已选区原始数据
			self.sourceData = $ko.observableArray([]); // 待选区数据
			self.targetData = $ko.observableArray([]); // 已选区数据
			self.searchTreeValue = $ko.observable(""); // 机构树搜索实现查询值
			self.isSelected=ko.observable(false); // 机构树搜索输入框光标焦点获取

			self.selectSource = $ko.observableArray([]); // 选择的待选成员
			self.selectTarget = $ko.observableArray([]); // 选择的已选成员

			// 当输入框的值发生变化时，响应的事件
			self.searchValue.subscribe(function(v) {
				var treeNode = null;
				if (self.ztree) {
					var nodes = self.ztree.getSelectedNodes();
					if (nodes.length > 0) {
						treeNode = nodes[0];
					}
				}

				if (treeNode != null) {
					loadSourceData.call(self, treeNode);
				}
			});
			
			// 机构树搜索实现
			// 当输入框的值发生变化时，响应的事件
			self.searchTreeValue.subscribe(function(v) {
				//在新搜索开始前应清理之前的搜索结果
				self.ztree.cancelSelectedNode();
				
				if (v==null || v=="") {
					//无值：全都不选中，折叠树
					self.ztree.cancelSelectedNode();
					self.ztree.expandAll(false);
				} else {
					//根据自定义规则搜索节点数据 JSON 对象集合 或 单个节点数据
					self.ztree.getNodesByFilter(filterFunc);
				}
				
				//自定义规则：展开树，选中匹配节点
				function filterFunc(node) {
					if(!node.isParent && node.name.indexOf(v) != -1) {
						self.ztree.selectNode(node,true,false);
					}
				}
				//保持光标在输入框
				self.isSelected(true);
			});

			self.getSelectDataStr = $ko.computed(function() {
				return self.getSelectData(self.options.selectKey);
			}, self);

			loadTargetData.call(self);

			self.isLoadingTree = $ko.observable(false);
		}
	};

	// 显示组织成员选择控件
	$ko.vsTeamMemberSelector.ViewModel.prototype.show = function() {
		var self = this;

		if (!self.ztree) {
			self.ztree = createTree.call(self);
		} else {
			var nodes = self.ztree.getNodes();
			if (nodes.length == 0) {
				self.ztree.reAsyncChildNodes(null, "refresh");
			}
		}

		var targetData0 = self.rawTargetData();
		self.targetData(targetData0);
		// var sourceData0 = self.rawSourceData();
		self.sourceData([]);

		if (!self.vsWin) {
			$(self.el).show();
		} else {
			self.vsWin.open();
		}
	};

	// 关闭组织成员选择控件
	$ko.vsTeamMemberSelector.ViewModel.prototype.close = function() {
		var self = this;

		if (!self.vsWin) {
			$(self.el).hide();
		} else {
			self.vsWin.close();
		}
	};

	// 确认选择的人员
	$ko.vsTeamMemberSelector.ViewModel.prototype.confirm = function() {
		var self = this;

		if (!self.vsWin) {
			$(self.el).hide();
		} else {
			self.vsWin.close();
		}

		var targetData0 = self.targetData();
		self.rawTargetData(targetData0);

		if (self.options.confirmFn) {
			self.options.confirmFn();
		}
	};

	$ko.vsTeamMemberSelector.ViewModel.prototype.render = function(item) {
		var self = this;
		
		if(self.options.renderFn == null){
			return item[self.options.selectKey];
		} else {
			return self.options.renderFn(item);
		}
	};

	// 获取选择的数据项(可通过属性名称获取，也可以获取整个数据对象集合),并用指定字符拼接（默认用逗号）
	// arg: 属性名称
	// s: 数据拼接符
	$ko.vsTeamMemberSelector.ViewModel.prototype.getSelectData = function(arg, s) {
		var self = this;
		var targetData0 = self.rawTargetData();
		if (typeof arg === "string" && targetData0 != undefined) {
			var data = [];
			for ( var index in targetData0) {
				data.push(targetData0[index][arg]);
			}
			if(s == "array"){
				return data;
			}
			if (s == undefined) {
				s = self.options.joinChar;
			}
			return data.join(s);
		}
		return targetData0;
	};

	// 移动单个成员，从待选区到已选区
	$ko.vsTeamMemberSelector.ViewModel.prototype.move = function() {
		var self = this;
		var key = self.options.memberIdKey;

		var moveItems = self.selectSource();
		var sourceData0 = self.sourceData();
		var targetData0 = self.targetData();

		// 将移动项从待选区移除
		var sourceData1 = $.grep(sourceData0, function(n, i) {
			for (var j = 0; j < moveItems.length; j++) {
				if (n[key] == moveItems[j]) {
					return false;
				}
			}
			return true;
		});
		self.sourceData(sourceData1);

		// 将移动项添加到已选区
		var sourceData2 = $.grep(sourceData0, function(n, i) {
			for (var j = 0; j < moveItems.length; j++) {
				if (n[key] == moveItems[j]) {
					return false;
				}
			}
			return true;
		}, true);
		var addTargetData = [];
		$.each(sourceData2, function(i, n) {
			var isExist = false;
			$.each(targetData0, function(j, m) {
				if (n[key] == m[key]) {
					isExist = true;
					return false;
				}
			});
			if (!isExist) {
				addTargetData.push(n);
			}
		});
		self.targetData(addTargetData.concat(targetData0));
	};

	// 移动全部成员，从待选区到已选区
	$ko.vsTeamMemberSelector.ViewModel.prototype.moveAll = function() {
		var self = this;
		var key = self.options.memberIdKey;

		var sourceData0 = self.sourceData();
		var targetData0 = self.targetData();

		// 将移动项从待选区移除
		self.sourceData([]);

		// 将移动项添加到已选区
		var addTargetData = [];
		$.each(sourceData0, function(i, n) {
			var isExist = false;
			$.each(targetData0, function(j, m) {
				if (n[key] == m[key]) {
					isExist = true;
					return false;
				}
			});
			if (!isExist) {
				addTargetData.push(n);
			}
		});
		self.targetData(addTargetData.concat(targetData0));
	};

	// 移除单个成员，从已选区到待选区
	$ko.vsTeamMemberSelector.ViewModel.prototype.remove = function() {
		var self = this;
		var key = self.options.memberIdKey;

		var removeItems = self.selectTarget();
		var sourceData0 = self.sourceData();
		var targetData0 = self.targetData();

		// 将移除项从已选区移除
		var targetData1 = $.grep(targetData0, function(n, i) {
			for (var j = 0; j < removeItems.length; j++) {
				if (n[key] == removeItems[j]) {
					return false;
				}
			}
			return true;
		});
		self.targetData(targetData1);

		// 将移除项添加到待选区
		var targetData2 = $.grep(targetData0, function(n, i) {
			for (var j = 0; j < removeItems.length; j++) {
				if (n[key] == removeItems[j]) {
					return false;
				}
			}
			return true;
		}, true);
		var addSourceData = [];
		$.each(targetData2, function(i, n) {
			var isExist = false;
			$.each(sourceData0, function(j, m) {
				if (n[key] == m[key]) {
					isExist = true;
					return false;
				}
			});
			if (!isExist) {
				addSourceData.push(n);
			}
		});
		self.sourceData(addSourceData.concat(sourceData0));
	};

	// 移除全部成员，从已选区到待选区
	$ko.vsTeamMemberSelector.ViewModel.prototype.removeAll = function() {
		var self = this;
		var key = self.options.memberIdKey;

		var sourceData0 = self.sourceData();
		var targetData0 = self.targetData();

		// 将移除项从已选区移除
		self.targetData([]);

		// 将移除项添加到待选区
		var addSourceData = [];
		$.each(targetData0, function(i, n) {
			var isExist = false;
			$.each(sourceData0, function(j, m) {
				if (n[key] == m[key]) {
					isExist = true;
					return false;
				}
			});
			if (!isExist) {
				addSourceData.push(n);
			}
		});
		self.sourceData(addSourceData.concat(sourceData0));
	};

	// 重新加载数据
	// opt: 配置项
	// isRefreshTree: 是否更新树,默认不更新
	$ko.vsTeamMemberSelector.ViewModel.prototype.reload = function(opt,
			isRefreshTree) {
		var self = this;

		if (opt) {
			self.options.memberIdValues = [];
			self.options = $.extend(true, {}, defaults, self.options, opt);
		}

		self.searchValue("");
		self.rawSourceData([]);
		self.rawTargetData([]);
		self.sourceData([]);
		self.targetData([]);
		self.selectSource([]);
		self.selectTarget([]);

		loadTargetData.call(self);

		if (self.ztree && isRefreshTree != undefined && isRefreshTree == true) {
			self.ztree.reAsyncChildNodes(null, "refresh");
		}
	};

	// 创建树控件
	function createTree() {
		var self = this;

		var setting = $.extend(true, {}, {
			callback : {
				onClick : function(event, treeId, treeNode, clickFlag) {
					// 点击树节点,加载相关数据
					loadSourceData.call(self, treeNode);
				},
				beforeAsync : function(treeId, treeNode) {
					if (self.isLoadingTree() == true) {
						return false;
					}
					self.isLoadingTree(true);
					return true;
				},
				onAsyncSuccess : function(event, treeId, treeNode, msg) {
					self.isLoadingTree(false);
				},
				onAsyncError : function(event, treeId, treeNode,
						XMLHttpRequest, textStatus, errorThrown) {
					self.isLoadingTree(false);

					alert("数据加载失败!");
				}
			}
		}, self.options.ztree_setting);
		
		if(self.options.data == null){
			return $.fn.zTree.init($("#" + self.treeId), setting);
		}else{
			return $.fn.zTree.init($("#" + self.treeId), setting, self.options.data);
		}
	}

	// 创建浮动窗口控件
	function createWin() {
		var self = this;
		var $el = $(self.el);

		var setting = $.extend(true, {}, {
			onOpen : function() {
				$el.show();
			},
			onClose : function() {
				$el.hide();
			}
		}, self.options.vsWin_setting);

		var vsWin = new $ko.vsWin.ViewModel(setting);
		vsWin.el = self.el;
		$el.hide();

		return vsWin;
	}

	// 加载待选成员数据
	// treeNode 选择的树节点
	function loadSourceData(treeNode) {
		var self = this;

		var result = {
			success : false,
			message : "数据加载失败",
			list : [],
			total : 0
		};

		var key = self.options.ztree_setting.data.simpleData.idKey;
		var key1 = self.options.teamIdKey;
		var key2 = self.options.memberNameKey;

		var params = {};
		params[key1] = treeNode[key];
		params[key2] = self.searchValue();
		if(self.options.loaderSourceFn != null){
			params = self.options.loaderSourceFn(params, treeNode);
		}

		$.ajax({
			url : self.options.memberUrl,
			type : "post",
			contentType : "application/json",
			data : $ko.toJSON(params),
			dataType : "json",
			complete : function() {
				self.rawSourceData.removeAll();
				self.sourceData.removeAll();
				if (result.success == false) {
					alert(result.message);
				} else if (result.list != null) {
					for (var i = 0; i < result.list.length; i++) {
						self.rawSourceData.push(result.list[i]);
						self.sourceData.push(result.list[i]);
					}
				}
			},
			success : function(d) {
				result = d;
			}
		});
	}

	// 加载默认已选成员数据
	function loadTargetData() {
		var self = this;

		var result = {
			success : false,
			message : "数据加载失败",
			list : [],
			total : 0
		};

		var memberIdValues = self.options.memberIdValues;

		if (memberIdValues.length == 0) {
			return;
		}

		var key = self.options.memberIdKey;
		var targetData0 = self.rawTargetData();
		if (memberIdValues.length == targetData0.length) {
			var isReturn = true;

			for (var i in targetData0) {
				if ($.inArray(targetData0[i][key], memberIdValues) < 0) {
					isReturn = false;
					break;
				}
			}

			if (isReturn) {
				return;
			}
		}

		var params = {};
		params[key] = [];
		for (var j in memberIdValues) {
			params[key].push(memberIdValues[j]);
		}
		if(self.options.loaderTargetFn != null){
			params = self.options.loaderTargetFn(params);
		}

		$.ajax({
			url : self.options.memberUrl,
			type : "post",
			contentType : "application/json",
			data : $ko.toJSON(params),
			dataType : "json",
			complete : function() {
				self.rawTargetData.removeAll();
				self.targetData.removeAll();
				if (result.success == false) {
					alert(result.message);
				} else if (result.list != null) {
					for (var i = 0; i < result.list.length; i++) {
						self.rawTargetData.push(result.list[i]);
						self.targetData.push(result.list[i]);
					}
				}
			},
			success : function(d) {
				result = d;
			}
		});
	}

	$ko.bindingHandlers.vsTeamMemberSelector = {
		init : function(element, valueAccessor, allBindingsAccessor, viewModel,
				bindingContext) {

			var accessor = valueAccessor();
			accessor.el = element;
			accessor.treeId = element.id + "_tree";

			while (element.firstChild)
				$ko.removeNode(element.firstChild);

			var templateName = allBindingsAccessor
					.get('teamMemberSelectorTemplate');
			var container = element.appendChild(document.createElement("DIV"));
			$ko.renderTemplate(templateName, accessor, {}, container,
					"replaceNode");

			accessor.vsWin = createWin.call(accessor);

			return {
				controlsDescendantBindings : true
			};
		},

		update : function(element, valueAccessor, allBindingsAccessor,
				viewModel, bindingContext) {

		}
	};
})(window, document, jQuery, ko);
/**
 * ========================================================================
 * vsTeamMemberOneSelector --组织成员选择控件(单选) 依赖jQuery,ko,jquery.ztree.core
 * ========================================================================
 */
(function(window, document, $, $ko, undefined) {
	// 默认配置
	var defaults = {
		memberUrl : "", // 请求成员的url
		teamIdKey : "fkOrgId", // 所属组织字段
		memberIdKey : "id", // 成员节点唯一标识字段
		memberIdValue : "", // 初始化已选成员节点的唯一标识
		memberNameKey : "name", // 模糊查询成员节点字段
		selectKey : "name",
		loaderSourceFn: null,
		loaderTargetFn: null,
		renderFn : null,
		confirmFn : null,
		data: null,

		// 树控件的默认配置
		ztree_setting : {
			async : {
				url : "", // 请求树数据的url
				enable : true,
				type : "post",
				contentType : "application/json",
				dataType : "json",
				cache : false
			},
			data : {
				key : {
					name : "name" // 组织节点名称标识字段
				},
				simpleData : {
					enable : true, // 开启简单数据模式
					idKey : "id", // 组织节点唯一标识字段
					pIdKey : "parentId", // 组织父节点唯一标识字段
					rootPId : "0" // 组织根节点的值
				}
			}
		},

		// 浮动窗口的默认配置
		vsWin_setting : {
			persist : true
		}
	};

	$ko.vsTeamMemberOneSelector = {
		// 构造函数
		ViewModel : function(opt) {
			var self = this;

			// 类属性
			self.options = $.extend(true, {}, defaults, opt); // 配置项
			self.ztree = null; // 树控件
			self.vsWin = null; // 浮动窗口控件
			self.searchValue = $ko.observable(""); // 查询值
			self.sourceData = $ko.observableArray([]); // 待选区数据
			self.selectSource = $ko.observableArray([]); // 选择的待选成员
			self.selectData = $ko.observable(null);

			// 当输入框的值发生变化时，响应的事件
			self.searchValue.subscribe(function(v) {
				var treeNode = null;
				if (self.ztree) {
					var nodes = self.ztree.getSelectedNodes();
					if (nodes.length > 0) {
						treeNode = nodes[0];
					}
				}

				if (treeNode != null) {
					loadSourceData.call(self, treeNode);
				}
			});

			self.getSelectDataStr = $ko.computed(function() {
				return self.getSelectData(self.options.selectKey);
			}, self);
			
			loadTargetData.call(self);

			self.isLoadingTree = $ko.observable(false);
			
			self.setOptionTitle = function(option, item) {
				option.title = item.name;
	            ko.applyBindingsToNode(option, item);
	        };
		}
	};

	// 显示组织成员选择控件
	$ko.vsTeamMemberOneSelector.ViewModel.prototype.show = function() {
		var self = this;

		if (!self.ztree) {
			self.ztree = createTree.call(self);
		} else {
			var nodes = self.ztree.getNodes();
			if (nodes.length == 0) {
				self.ztree.reAsyncChildNodes(null, "refresh");
			}
		}

		var data = [];
		var selectData = self.selectData();
		if (selectData != null) {
			data.push(selectData);
		}
		self.sourceData(data);

		if (!self.vsWin) {
			$(self.el).show();
		} else {
			self.vsWin.open();
		}
	};

	// 关闭组织成员选择控件
	$ko.vsTeamMemberOneSelector.ViewModel.prototype.close = function() {
		var self = this;

		if (!self.vsWin) {
			$(self.el).hide();
		} else {
			self.vsWin.close();
		}
	};

	// 确认选择的成员
	$ko.vsTeamMemberOneSelector.ViewModel.prototype.confirm = function() {
		var self = this;

		if (!self.vsWin) {
			$(self.el).hide();
		} else {
			self.vsWin.close();
		}

		var key = self.options.memberIdKey;
		var moveItem = self.selectSource();
		if (moveItem.length > 0) {
			var sourceData = self.sourceData();
			$.each(sourceData, function(i, value) {
				if (value[key] == moveItem[0]) {
					self.selectData(value);
					return false;
				}
			});
		}

		if (self.options.confirmFn) {
			self.options.confirmFn();
		}
	};

	$ko.vsTeamMemberOneSelector.ViewModel.prototype.render = function(item) {
		var self = this;
		
		if(self.options.renderFn == null){
			return item[self.options.selectKey];
		} else {
			return self.options.renderFn(item);
		}
	};

	// 清除选择的成员
	$ko.vsTeamMemberOneSelector.ViewModel.prototype.clear = function() {
		var self = this;

		if (!self.vsWin) {
			$(self.el).hide();
		} else {
			self.vsWin.close();
		}

		self.selectData(null);
	};

	// 获取选择的数据项(可通过属性名称获取，也可以获取整个数据对象)
	// arg: 属性名称
	$ko.vsTeamMemberOneSelector.ViewModel.prototype.getSelectData = function(arg) {
		var self = this;
		var selectData = self.selectData();
		if (typeof arg === "string") {
			return selectData == null ? "" : selectData[arg];
		}
		return selectData;
	};

	// 重新加载数据
	// opt: 配置项
	// isRefreshTree: 是否更新树,默认不更新
	$ko.vsTeamMemberOneSelector.ViewModel.prototype.reload = function(opt,
			isRefreshTree) {
		var self = this;

		if (opt) {
			self.options.memberIdValue = "";
			self.options = $.extend(true, {}, defaults, self.options, opt);
		}

		self.searchValue("");
		self.sourceData([]);
		self.selectSource([]);

		loadTargetData.call(self);

		if (self.ztree && isRefreshTree != undefined && isRefreshTree == true) {
			self.ztree.reAsyncChildNodes(null, "refresh");
		}
	};

	// 创建树控件
	function createTree() {
		var self = this;

		var setting = $.extend(true, {}, {
			callback : {
				onClick : function(event, treeId, treeNode, clickFlag) {
					// 点击树节点,加载相关数据
					loadSourceData.call(self, treeNode);
				},
				beforeAsync : function(treeId, treeNode) {
					if (self.isLoadingTree() == true) {
						return false;
					}
					self.isLoadingTree(true);
					return true;
				},
				onAsyncSuccess : function(event, treeId, treeNode, msg) {
					self.isLoadingTree(false);
				},
				onAsyncError : function(event, treeId, treeNode,
						XMLHttpRequest, textStatus, errorThrown) {
					self.isLoadingTree(false);

					alert("数据加载失败!");
				}
			}
		}, self.options.ztree_setting);

		if(self.options.data == null){
			return $.fn.zTree.init($("#" + self.treeId), setting);
		}else{
			return $.fn.zTree.init($("#" + self.treeId), setting, self.options.data);
		}
	}

	// 创建浮动窗口控件
	function createWin() {
		var self = this;
		var $el = $(self.el);

		var setting = $.extend(true, {}, {
			onOpen : function() {
				$el.show();
			},
			onClose : function() {
				$el.hide();
			}
		}, self.options.vsWin_setting);

		var vsWin = new $ko.vsWin.ViewModel(setting);
		vsWin.el = self.el;
		$el.hide();

		return vsWin;
	}

	// 加载待选成员数据
	// treeNode 选择的树节点
	function loadSourceData(treeNode) {
		var self = this;

		var result = {
			success : false,
			message : "数据加载失败",
			list : [],
			total : 0
		};

		var key = self.options.ztree_setting.data.simpleData.idKey;
		var key1 = self.options.teamIdKey;
		var key2 = self.options.memberNameKey;

		var params = {};
		params[key1] = treeNode[key];
		params[key2] = self.searchValue();
		if(self.options.loaderSourceFn != null){
			params = self.options.loaderSourceFn(params);
		}

		$.ajax({
			url : self.options.memberUrl,
			type : "post",
			contentType : "application/json",
			data : $ko.toJSON(params),
			dataType : "json",
			complete : function() {
				self.sourceData.removeAll();
				if (result.success == false) {
					alert(result.message);
				} else if (result.list != null) {
					for (var i = 0; i < result.list.length; i++) {
						self.sourceData.push(result.list[i]);
					}
				}
			},
			success : function(d) {
				result = d;
			}
		});
	}

	// 加载默认已选成员数据
	function loadTargetData() {
		var self = this;

		var result = {
			success : false,
			message : "数据加载失败",
			list : [],
			total : 0
		};

		var memberIdValue = self.options.memberIdValue;

		if (memberIdValue == "") {
			return;
		}

		var key = self.options.memberIdKey;
		var params = {};
		params[key] = [ memberIdValue ];
		if(self.options.loaderTargetFn != null){
			params = self.options.loaderTargetFn(params);
		}

		$.ajax({
			url : self.options.memberUrl,
			type : "post",
			contentType : "application/json",
			data : $ko.toJSON(params),
			dataType : "json",
			complete : function() {
				self.selectData(null);
				if (result.success == false) {
					alert(result.message);
				} else if (result.list != null && result.list.length > 0) {
					self.selectData(result.list[0]);
				}
			},
			success : function(d) {
				result = d;
			}
		});
	}

	$ko.bindingHandlers.vsTeamMemberOneSelector = {
		init : function(element, valueAccessor, allBindingsAccessor, viewModel,
				bindingContext) {

			var accessor = valueAccessor();
			accessor.el = element;
			accessor.treeId = element.id + "_tree";

			while (element.firstChild)
				$ko.removeNode(element.firstChild);

			var templateName = allBindingsAccessor
					.get('teamMemberOneSelectorTemplate');
			var container = element.appendChild(document.createElement("DIV"));
			$ko.renderTemplate(templateName, accessor, {}, container,
					"replaceNode");

			accessor.vsWin = createWin.call(accessor);

			return {
				controlsDescendantBindings : true
			};
		},

		update : function(element, valueAccessor, allBindingsAccessor,
				viewModel, bindingContext) {

		}
	};
})(window, document, jQuery, ko);