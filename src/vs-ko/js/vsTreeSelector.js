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