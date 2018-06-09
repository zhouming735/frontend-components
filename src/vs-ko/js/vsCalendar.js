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