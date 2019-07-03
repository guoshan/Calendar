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
    // 默认选中数据
    this.data                = option.data;

    this.initDate            = option.initDate || null;
    //是否显示邻居月份
    this.isShowNeighbor      = option.isShowNeighbor || false;
    //需要标记的数组列表
    this.markData            = option.markData;
    // 默认激活样式
    this.defalutActive       = option.defalutActive;
    //日历渲染完成callback
    this.renderedCallback    = callback;
    //点击单个日期后的callback
    this.clickDayCallback    = option.clickDayCallback;
    //切换月份的回调
    this.changeMonthCallback = option.changeMonthCallback;
}
Calendar.prototype = {
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
    // 点击跳到上一月或者下一月或者指定年月
    changeMonth(timeStamp) {
        var _this = this;
        var dateArr = this.saveTime;
        var targetDate = new Date(parseInt(timeStamp));
        dateArr[0] = targetDate.getFullYear();
        dateArr[1] = targetDate.getMonth() + 1;
        if (this.changeMonthCallback) {
            this.changeMonthCallback(function (markData) {
                _this.markData = markData || [];
                _this.initBody(dateArr[0], dateArr[1]);
            });
        } else {
            _this.initBody(dateArr[0], dateArr[1]);
        }
        
    },
    /**
     * 初始化日历头部
     * @param {*} year 
     * @param {*} month 
     */
    initHeader(year, month) {
        var html            = [];
        var calHeader       = document.createElement('div');
        calHeader.className = 'calendar-header';

        html.push(['<button data-stamp="" id="calendarHeaderLeft" class="calendar-header-left">上一月</button>',
            '<div id="calendarHeaderCenter" class="calendar-header-center"><span id="curDate"></span><i class="angle-down"></i></div>',
            '<button data-stamp="" id="calendarHeaderRight" class="calendar-header-right">下一月</button>'].join(""));
        calHeader.innerHTML = html.join('');
        this.container.appendChild(calHeader);
        this.setHeaderBtnStamp(year, month);
        
    },
    //初始化星期头
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
    //初始化日历
    initBody: function (curYear, curMonth) {
        if (!curYear) {
            curYear = this.saveTime[0];
            curMonth = this.saveTime[1];
        }
        console.error(curMonth);
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
        // this.setDefaultActivate();
    },
    addEventListener: function () {
        var _this = this;
        this.dateContent.addEventListener('click', function (e) {
            //js取事件元兼容问题？
            var event = e.target;
            console.error(event);
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
                _this.removeClassName();
                event.className = _this.activateClass + ' ' + event.className;
                if (!regx.test(className)) {
                    _this.clickDayCallback && _this.clickDayCallback();
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
        });
    },
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
    // 默认激活数据
    setDefaultActivate() {
        // 找到可点击元素
        var activateClassDom = document.querySelectorAll('.clickableSpan');
        for (var i in this.data) {
            for (var n = 0; n < activateClassDom.length; n++) {
                var time = activateClassDom[n].getAttribute('data-date');
                if (this.data[i] == time) {
                    activateClassDom[n].className = activateClassDom[n].className + ' ' + this.defalutActive;
                    break;
                }
            }
        }

    },
    /**
     * 获取日期的时间戳
     * @param {*} year 
     * @param {*} month 
     * @param {*} day 
     */
    getTargetTimeStamp(year, month, day) {
        if (day) {
            var tagDate = new Date(year, month-1, day);
        } else {
            var tagDate = new Date(year, month-1);
        }
        return tagDate.getTime();
    },
    getDateDiff(time) {
        //将xxxx-xx-xx的时间格式，转换为 xxxx/xx/xx的格式 
        return time.replace(/\-/g, "/");
    }
}