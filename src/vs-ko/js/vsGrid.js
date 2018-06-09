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