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