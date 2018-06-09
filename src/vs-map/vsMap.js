/**
 * ========================================================================
 * vsMap --Svg地图控件 依赖jQuery,Raphael
 * ========================================================================
 */
(function (window, document, $, $r, undefined) {
	var defaults = {
		width: 700,
		height: 600,
		scale: 1,
		data: [],
		areaAttr: {
			'transform': "t30,0", 
			'fill': '#AAD5FF',
			'cursor': 'pointer',
			'stroke': '#fff',
			'stroke-width': 1,
			'stroke-linejoin': 'round'
		},
		areaSelAttr: {
			'transform': "t30,0 s1.03 1.03",
			'fill': '#BBB',
			'cursor': 'pointer',
			'stroke': '#fff',
			'stroke-width': 2,
			'stroke-linejoin': 'round'
		},
		textAttr: {
			"fill": "#000",
			"font-size": "12px",
			"cursor": "pointer"
		},
		renderFn: null,
		hoverInFn: null,
		hoverOutFn: null
	};

	function Map(el, opt) {
		var self = this;
		self.$el = el;

		init.call(self, opt);
	}

	Map.prototype.reload = function (opt) {
		var self = this;

		init.call(self, opt);
	};

	function init(opt){
		var self = this;

		self.options = $.extend(true, {}, defaults, opt);

		if ($r.type == "VML") {
			delete self.options.areaAttr.transform;
			delete self.options.areaSelAttr.transform;
		}

		self.data = self.options.data;
		self.paper = null;
		self.nestedWrapper = null;

		render.call(self);
	}

	Map.prototype.init=init;

	function render(){
		var self = this;
		
		// 将地图绘制到制定层上
		scaleRaphael.call(self);
		
		for(var i=0; i< self.data.length; i++){
			renderArea.call(self, i);
		}
	}

	function scaleRaphael(){
		var self = this;

		var container = self.$el.attr("id");
		var width = self.options.width;
		var height = self.options.height;

		var wrapper = self.$el[0];

		if (!wrapper.style.position) wrapper.style.position = "relative";
		wrapper.style.width = width + "px";
		wrapper.style.height = height + "px";
		wrapper.style.overflow = "hidden";

		if ($r.type == "VML") {
			wrapper.innerHTML = "<rvml:group style='position: absolute; width: 1000px; height: 1000px; top: 0; left: 0' coordsize='1000,1000' class='rvml' id='vmlgroup_" + container + "'><\/rvml:group>";
			self.nestedWrapper = document.getElementById("vmlgroup_" + container);
		} else {
			wrapper.innerHTML = "<div id='svggroup_" + container + "'><\/div>";
			self.nestedWrapper = document.getElementById("svggroup_" + container);
		}

		var nestedWrapper = self.nestedWrapper;
		var paper = self.paper = new $r(nestedWrapper, width, height);

		if ($r.type == "SVG") {
			paper.setViewBox(0, 0, width, height, true);
		}

		self.scaleAll(self.options.scale);
	}

	Map.prototype.scaleAll = function(scale){
		var self = this;

		var width = self.options.width;
		var height = self.options.height;

		self.changeSize(width * scale, height * scale);
	};

	Map.prototype.changeSize = function(w, h, center, clipping){
		var self = this;

		var width = self.options.width;
		var height = self.options.height;

		var paper = self.paper;
		var wrapper = self.$el[0];
		var nestedWrapper = self.nestedWrapper;

		clipping = !clipping;
		var ratioW = w / width;
		var ratioH = h / height;
		var scale = ratioW < ratioH ? ratioW : ratioH;
		var newHeight = parseInt(height * scale);
		var newWidth = parseInt(width * scale);

		if ($r.type == "VML") {
			var txt = document.getElementsByTagName("textpath");
			for (var i in txt) {
				var curr = txt[i];
				if (curr.style) {
					if (!curr._fontSize) {
						var mod = curr.style.fontSize.split("px");
						curr._fontSize = parseInt(mod[0]);
					}
					curr.style.fontSize = curr._fontSize * scale + "px";
				}
			}
			var newSize;
			if (newWidth < newHeight) {
				newSize = newWidth * 1000 / width;
			} else {
				newSize = newHeight * 1000 / height;
			}
			newSize = parseInt(newSize);
			nestedWrapper.style.width = newSize + "px";
			nestedWrapper.style.height = newSize + "px";
			if (clipping) {
				nestedWrapper.style.left = parseInt((w - newWidth) / 2) + "px";
				nestedWrapper.style.top = parseInt((h - newHeight) / 2) + "px";
			}

			wrapper.getElementsByTagName("div")[0].style.overflow = "visible";
		}

		if (clipping) {
			newWidth = w;
			newHeight = h;
		}

		wrapper.style.width = newWidth + "px";
		wrapper.style.height = newHeight + "px";

		paper.setSize(newWidth, newHeight);

		if (center) {
			wrapper.style.position = "absolute";
			wrapper.style.left = parseInt((w - newWidth) / 2) + "px";
			wrapper.style.top = parseInt((h - newHeight) / 2) + "px";
		}
	};

	function renderArea(index){
		var self = this;

		var item = self.data[index];
		var paper = self.paper; 

		var area = paper.path(item.path);
		area.id = item.id;
		area.attr(self.options.areaAttr);
		
		var xx = area.getBBox().x + (area.getBBox().width / 2);
		var yy = area.getBBox().y + (area.getBBox().height / 2);
		area.text = paper.text(xx, yy, item.name).attr(self.options.textAttr);

		area.hover(function(){
			area.data("oldAttr", area.attr());
			area.attr(self.options.areaSelAttr);

			if(self.options.hoverInFn){
				self.options.hoverInFn(self, area);
			}

		}, function(){
			var oldAttr = area.data("oldAttr");
			area.attr(oldAttr);

			if(self.options.hoverOutFn){
				self.options.hoverOutFn(self, area);
			}
		}, null, null);

		if(self.options.renderFn){
			self.options.renderFn(self, area);
		}

		//self.changeSize(self.options.width, self.options.height, false, false);
	}

	var old = $.fn.vsMap;

	$.fn.vsMap = function (opt) {
		var self = this;

		var data = $.data(self[0], 'vsMap');

		if (data) {
			
			data.init(opt);
		
		} else {
			$.data(self[0], 'vsMap', (data = new Map(self, opt)));
		}

		return data;
	};

	$.fn.vsMap.constructor = Map;

	$.fn.vsMap.noConflict = function () {
		$.fn.vsMap = old;
		return this;
	};
})(window, document, jQuery, Raphael);