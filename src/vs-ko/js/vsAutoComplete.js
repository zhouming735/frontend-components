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