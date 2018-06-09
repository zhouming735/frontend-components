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