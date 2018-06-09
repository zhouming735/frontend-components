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