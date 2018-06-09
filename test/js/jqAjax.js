/**
 * ========================================================================
 * 重写jQuery的ajax请求,加入会话过期后跳转到登录页
 * ========================================================================
 */
(function(window, document, $, undefined) {
	var defaults = {
		logoutUrl : ""
	}

	function JQAjax(config) {
		var self = this;
		self.config = config;

		ajaxSetup.call(self);
		ajaxOverride.call(self);
		bsTableOverride.call(self);
	}

	// 配置jquery全局的ajax事件
	function ajaxSetup() {
		$.ajaxSetup({
			type : "post",
			contentType : "application/json",
			dataType : "json",
			cache : false
		});
	}

	function ajaxOverride() {
		var self = this;

		var _ajax = $.ajax;
		var _alert = false;

		$.ajax = function(opt) {
			var fn = {
				beforeSend : function(xhr) {
					return true;
				},
				complete : function(xhr, textStatus) {
                    
                },
				success : function(data, textStatus, xhr) {

				},
				error : function(xhr, textStatus, errorThrown) {
                
                }
			}

			if (opt.beforeSend) {
				fn.beforeSend = opt.beforeSend;
			}
			if (opt.complete) {
				fn.complete = opt.complete;
			}
			if (opt.success) {
				fn.success = opt.success;
			}
			if (opt.error) {
				fn.error = opt.error;
			}

			var _opt = $.extend(opt,{
				beforeSend : function(xhr) {
                    fn.beforeSend();
                    
                    window.setTimeout(function(){
                        fn.success({
                            hasLogin: true,
                            hasLogin: true,
                            message: "操作成功",
                            total: 100,
                            list:[{id:1,name:'测试1',code:1}, {id:2,name:'测试2',code:2}, {id:3,name:'测试3',code:3}]
                        })
                        fn.complete();
                    }, 200);

					return false;
				},
				complete : function(xhr, textStatus) {
					fn.complete(xhr, textStatus);
				},
				success : function(data, textStatus, xhr) {
					fn.success(data, textStatus, xhr);
				},
				error : function(xhr, textStatus, errorThrown) {
					fn.error(xhr, textStatus, errorThrown);
				}
			})

			_ajax(_opt);
		}
	}

	// 重写datagrid的loader,loadFilter
	function bsTableOverride() {
		var self = this;

		var _init = $.fn.bootstrapTable.Constructor.prototype.init;
		$.fn.bootstrapTable.Constructor.prototype.init = function() {
			var $this = this;
			if ($this.options.jqAjax) {
				$this.options.dataField = "list"
			}
			_init.call($this);
		}

	}

	+function() {
		var config = $.extend(true, {}, defaults, window.$vsConfig);
		new JQAjax(config);
	}()

})(window, document, jQuery);