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