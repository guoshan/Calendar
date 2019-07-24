function Calendar(option, callback) {
    // 日历激活样式重置
    this.activateClass       = option.activateClass;
    // 保存当前日期用于下次翻月
    this.saveTime            = null;
    // 日历头部
    this.weekTitle           = (option.weekTitle || ['日', '一', '二', '三', '四', '五', '六']);
    // 日历区域样式重置
    this.cusClass            = option.cusClass;
    // 生成挂在日历的虚拟dom元素
    this.dateContent         = document.createElement('div');
    // 真实挂载区域
    this.container           = option.container;
    // 默认选中日期
    this.defaultActiveDate   = option.defaultActiveDate;
    
    //初次渲染默认日期
    this.initDate            = option.initDate || null;
    //是否显示邻居月份
    this.isShowNeighbor      = option.isShowNeighbor || false;
    //需要标记的数组列表
    this.markData            = option.markData;
    //日历渲染完成callback
    this.renderedCallback    = callback;
    //点击单个日期后的callback
    this.clickDayCallback    = option.clickDayCallback;
    //切换月份的回调
    this.changeMonthCallback = option.changeMonthCallback;
    //点击日历头部的日期
    this.clickHeaderCenter   = option.clickHeaderCenter;
}
Calendar.prototype = {
    constructor: Calendar,
    init: function () {
        var date  = new Date();
        if (this.initDate) {
            date  = new Date(this.getDateDiff(this.initDate));
        }
        var year  = date.getFullYear();
        var month = date.getMonth() + 1;
        //初始化头部
        this.initHeader(year, month);
        // 初始化周期
        this.initWeekTitle();
        // 初始化日期
        this.initBody(year, month);
        // 挂在监听事件
        this.addEventListener();
    },
    /**
     * 跳到指定年月
     * @param {*} timeStamp 时间戳
     * @param {*} calThis calendar的 this
     */
    changeMonth: function(timeStamp) {
        var _this = this;
        var dateArr = _this.saveTime;
        var targetDate = new Date(parseInt(timeStamp));
        dateArr[0] = targetDate.getFullYear();
        dateArr[1] = targetDate.getMonth() + 1;
        if (_this.changeMonthCallback) {
            _this.changeMonthCallback(dateArr[0], dateArr[1]);
        } else {
            _this.initBody(dateArr[0], dateArr[1]);
        }
    },
    /**
     * 初始化日历头部
     * @param {*} year 
     * @param {*} month 
     */
    initHeader: function(year, month) {
        var html            = [];
        var calHeader       = document.createElement('div');
        calHeader.className = 'calendar-header';

        html.push(['<div data-stamp="" id="calendarHeaderLeft" class="calendar-header-left">上一月</div>',
            '<div id="calendarHeaderCenter" class="calendar-header-center"><span id="curDate"></span><i class="angle-down"></i></div>',
            '<div data-stamp="" id="calendarHeaderRight" class="calendar-header-right">下一月</div>'].join(""));
        calHeader.innerHTML = html.join('');
        this.container.appendChild(calHeader);
        this.setHeaderBtnStamp(year, month);
    },
    /**
     * 初始化星期头
     */
    initWeekTitle: function () {
        var calBody       = document.createElement('div');
        calBody.className = 'calendar-body';
        calBody.id        = 'calendarContainerBody';
        var html    = [];

        html.push(['<ul class="g-dete-header-ul">'].join(""));
        for (var i in this.weekTitle) {
            html.push(['<li><span>' , this.weekTitle[i] , '</span></li>'].join(""));
        }
        html.push(['</ul>'].join(""));
        calBody.innerHTML = html.join("");
        this.container.appendChild(calBody);
    },
    /**
     * 初始化日历body
     * @param {*} curYear 
     * @param {*} curMonth 
     */
    initBody: function (curYear, curMonth) {
        if (!curYear) {
            curYear = this.saveTime[0];
            curMonth = this.saveTime[1];
        }
        this.saveTime           = [curYear, curMonth];
        //获取当前前月的第一天是周几
        var currentFristDayWeek = new Date(curYear, curMonth - 1, 1).getDay();
        // 当前月总天数
        var currentLastDay      = new Date(curYear, curMonth, 0).getDate();
        //上个月总天数
        var last_date           = new Date(curYear, curMonth - 1, 0).getDate();
        // 剩余格数
        var surplus             = 42 - currentFristDayWeek - currentLastDay; // 42-4-31 = 7;
        var html                = [];
        var ol                  = document.createElement('ul');
        ol.className = 'g-date-body-ul ' + this.cusClass;
        // 上一个月的灰色区域
        for (var i = 0; i < currentFristDayWeek; i++) {
            if (this.isShowNeighbor) {
                var preCurDay = (last_date - (currentFristDayWeek - 1) + i);
                var preTimeStamp = this.getTargetTimeStamp(curYear, curMonth - 1, preCurDay);
                html.push(['<li class="g-calendar-grey g-prev"><span class="g-prev" data-stamp="', preTimeStamp ,'">', preCurDay ,'</span></li>'].join(""));
            } else {
                html.push(['<li class="g-calendar-grey"><span></span></li>'].join(""));
            }
        }
        // 当前月
        for (var j = 0; j < currentLastDay; j++) {
            var time = this.getTargetTimeStamp(curYear, curMonth, j+1);
            var markObj = this.markData[time] || {};
            html.push(['<li><span class="',
                markObj.style,
                markObj.isDisabled?'':' g-selectable',
            '" data-stamp=',
                time,
            ' data-status="',
                markObj.status,
            '">',
                (j + 1),
            '</span>',
            '</li>'].join(""));
        }
         // 下一个月灰色区域
        if(surplus < 14 && surplus >= 7) {
            surplus = surplus - 7;
        } else if (surplus == 14) {
            surplus = 0;
        }
        for (var k = 0; k < surplus; k++) {
            if (this.isShowNeighbor) {
                var nextTimeStamp = this.getTargetTimeStamp(curYear, curMonth + 1, k+1);
                html.push(['<li class="g-calendar-grey g-next"><span class="g-next" data-stamp="', nextTimeStamp ,'">', (k + 1) ,'</span></li>'].join(" "));
            } else {
                html.push(['<li class="g-calendar-grey"><span></span></li>'].join(" "));
            }
        }
        ol.innerHTML               = html.join("");
        this.dateContent.className = "g-content-box";
        this.dateContent.innerHTML = "";
        this.dateContent.appendChild(ol);
        document.getElementById("calendarContainerBody").appendChild(this.dateContent);
        this.setHeaderBtnStamp(curYear, curMonth);
        document.getElementById('curDate').innerHTML = curYear + '-' + curMonth;

        this.renderedCallback && this.renderedCallback(1, {curDateText: curYear + '-' + curMonth});
        if (this.defaultActiveDate) {
            this.setDefaultActivate();
        }
    },
    /**
     * 添加事件监听
     */
    addEventListener: function () {
        var _this = this;
        this.dateContent.addEventListener('click', function (e) {
            //js取事件元兼容问题？
            var event = e.target;
            if (event.tagName != 'SPAN') {
                event = event.firstChild
            }
            var className = event.className;
            var stamp = event.getAttribute("data-stamp");
            if (/g-prev/i.test(className)) {
                _this.changeMonth(stamp);
            } else if (/g-next/i.test(className)) {
                _this.changeMonth(stamp);
            } else if (/g-selectable/.test(className)) {
                var regx = new RegExp(_this.activateClass, 'g');
                _this.defaultActiveDate = event.getAttribute("data-stamp");
                _this.removeClassName();
                event.className = _this.activateClass + ' ' + event.className;
                if (!regx.test(className)) {
                    var currentDayData = _this.markData[_this.defaultActiveDate] || null;
                    _this.clickDayCallback && _this.clickDayCallback(currentDayData, _this.defaultActiveDate);
                }
            } else {
                // _this.removeClassName();
                // event.className = _this.activateClass + ' ' + event.className;
                // // event = {curDateText: curYear + '-' + curMonth}
                // _this.renderedCallback(2, event);
            }
        });
        document.getElementById("calendarHeaderLeft").addEventListener('click', function (e) {
            var event = e.target;
            var stamp = event.getAttribute("data-stamp");
            _this.changeMonth(stamp);
        });
        document.getElementById("calendarHeaderRight").addEventListener('click', function (e) {
            var event = e.target;
            var stamp = event.getAttribute("data-stamp");
            _this.changeMonth(stamp);
        });;
        document.getElementById("calendarHeaderCenter").addEventListener('click', function (e) {
            var event = e.target.firstChild;
           _this.clickHeaderCenter && _this.clickHeaderCenter(_this.saveTime[0], _this.saveTime[1]);

        });
    },
    /**
     * 移除所有某个className
     */
    removeClassName: function () {
        var activateClassDom = document.querySelectorAll('.' + this.activateClass);
        var reg = new RegExp(this.activateClass + ' ', 'g');
        for (var i = 0; i < activateClassDom.length; i++) {
            activateClassDom[i].className = activateClassDom[i].className.replace(reg, '');
        }
    },
    /**
     * 给上一月，下一月按钮设置时间戳
     * @param {*} year 
     * @param {*} month 
     */
    setHeaderBtnStamp: function (year, month) {
        var preMonthStamp = this.getTargetTimeStamp(year, month-1);
        var nextMonthStemp = this.getTargetTimeStamp(year, month+1);
        document.getElementById('calendarHeaderLeft').setAttribute("data-stamp", preMonthStamp);
        document.getElementById('calendarHeaderRight').setAttribute("data-stamp", nextMonthStemp);
    },
    /**
     * 默认选中日期
     */
    setDefaultActivate: function() {
        if (/^\d+$/.test(this.defaultActiveDate)) {
            var defaultDateStamp = this.defaultActiveDate;
        } else {
            var defaultDate      = new Date(this.getDateDiff(this.defaultActiveDate));
            var year             = defaultDate.getFullYear();
            var month            = defaultDate.getMonth() + 1;
            var day              = defaultDate.getDay();
            var defaultDateStamp = this.getTargetTimeStamp(year, month, day);
        }
        // 找到可点击元素
        var activateClassDom = document.querySelectorAll('.g-selectable');
        for (var i = 0; i < activateClassDom.length; i++) {
            var time = activateClassDom[i].getAttribute('data-stamp');
            if (defaultDateStamp == time) {
                activateClassDom[i].className = this.activateClass + ' ' + activateClassDom[i].className;
                break;
            }
        }
        var currentDayData = this.markData[this.defaultActiveDate] || null;
        this.clickDayCallback && this.clickDayCallback(currentDayData, defaultDateStamp);
    },
    /**
     * 获取日期的时间戳
     * @param {*} year 
     * @param {*} month 
     * @param {*} day 
     */
    getTargetTimeStamp: function(year, month, day) {
        if (day) {
            var tagDate = new Date(year, month-1, day);
        } else {
            var tagDate = new Date(year, month-1);
        }
        return tagDate.getTime();
    },
    /**
     * 将xxxx-xx-xx的时间格式，转换为 xxxx/xx/xx的格式
     * @param {*} time 
     */
    getDateDiff: function(time) {
        return time.replace(/\-/g, "/");
    },
    setCurentDateText: function(dateStr) {
        document.getElementById('curDate').innerHTML = dateStr;
    }
}