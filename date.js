function Calendar(option, callBack) {
    // 日历激活样式重置
    this.activateClass = option.activateClass;
    // 保存当前日期用于下次翻月
    this.saveTime = null;
    // 日历头部
    this.weekTitle = (option.weekTitle || ['日', '一', '二', '三', '四', '五', '六']);
    // 日历区域样式重置
    this.cusClass = option.cusClass;
    // 生成挂在日历的虚拟dom元素
    this.dateContent = document.createElement('div');
    // 真实挂载区域
    this.content = option.content;
    // 默认选中数据
    this.data = option.data;
    //需要标记的数组列表
    this.markData = option.markData;
    //需要标记的样式对象
    this.markStyle = option.markStyle;
    //需要标记样式的文本
    this.markStatus = option.markStatus;
    // 默认激活样式
    this.defalutActive = option.defalutActive;
    this.callBack = callBack;
}
Calendar.prototype = {
    init: function () {
        var date = new Date();
        var year = date.getFullYear();
        var month = date.getMonth() + 1;
        // 初始化周期
        this.initHeader();
        // 初始化日期
        this.initBody(year, month);
        // 挂在监听事件
        this.addEventListener();
    },
    // 点击跳到上一月或者下一月或者指定年月
    changeMonth(timeStamp) {
        var dateArr = this.saveTime;
        var targetDate = new Date(parseInt(timeStamp));
        dateArr[0] = targetDate.getFullYear();;
        dateArr[1] = targetDate.getMonth() + 1;
        this.initBody(dateArr[0], dateArr[1]);
    },
    //初始化星期头
    initHeader: function () {
        var html = "";
        var ol = document.createElement('ul');
        ol.className = "g-dete-header-ul"
        for (var i in this.weekTitle) {
            html += '<li><span>' + this.weekTitle[i] + '</span></li>';
        }
        ol.innerHTML = html;
        this.content.appendChild(ol);
    },
    //初始化日历
    initBody: function (curYear, curMonth) {
        if (!curYear) {
            curYear = this.saveTime[0];
            curMonth = this.saveTime[1];
        }
        console.error(curMonth);
        this.saveTime = [curYear, curMonth];
        //获取当前前月的第一天是周几
        var currentFristDayWeek = new Date(curYear, curMonth - 1, 1).getDay();
        // 当前月总天数
        var currentLastDay = new Date(curYear, curMonth, 0).getDate();
        //上个月总天数
        var last_date = new Date(curYear, curMonth - 1, 0).getDate();
        // 剩余格数
        var surplus = 42 - currentFristDayWeek - currentLastDay; // 42-4-31 = 7;
        var html = [];
        var ol = document.createElement('ul');
        ol.className = 'g-date-body-ul ' + this.cusClass;
        // 上一个月的灰色区域
        for (var i = 0; i < currentFristDayWeek; i++) {
            html.push(['<li class="g-calendar-grey g-prev"><span class="g-prev">',(last_date - (currentFristDayWeek - 1) + i),'</span></li>'].join(""));
        }
        // 当前月
        for (var j = 0; j < currentLastDay; j++) {
            var time = this.getTargetTimeStamp(curYear, curMonth, j+1);
            var attrObj = this.getTargetTimeAttr(curYear, curMonth, j+1);
            var itemMarkStyle = this.markStyle[attrObj.status] || '';
            html.push(['<li><span class="',
                itemMarkStyle,
                attrObj.isSelectable?' g-selectable':'',
            '" data-date=',
                time,
            ' data-status="',
                attrObj.status,
            '">',
                (j + 1),
            '</span>',
                attrObj.isShowTips?`<a class="g-mark-text">${this.markStatus[attrObj.status]}</a>`:'',
            '</li>'].join(""));
        }
         // 下一个月灰色区域
        // if(surplus < 14 && surplus >= 7) {
        //     surplus = surplus -7;
        // } else if (surplus == 14) {
        //     surplus = 0;
        // }
        for (var k = 0; k < surplus; k++) {
            html.push(['<li class="g-calendar-grey g-next"><span class="g-next">', (k + 1) ,'</span></li>'].join(" "));
        }
        ol.innerHTML = html.join("");
        this.dateContent.className = "g-content-box";
        this.dateContent.innerHTML = "";
        this.dateContent.appendChild(ol);
        this.content.appendChild(this.dateContent);
        this.callBack(1, {curDateText: curYear + '-' + curMonth});
        // this.setDefaultActivate();
    },
    addEventListener: function () {
        var _this = this;
        this.dateContent.addEventListener('click', function (e) {
            //js取事件元兼容问题？
            var event = e.target;
            if (event.tagName != 'SPAN') {
                event = event.firstChild
            }
            var className = event.className;
            if (/g-prev/i.test(className)) {
                // _this.changeMonth(1);
            } else if (/g-next/i.test(className)) {
                // _this.changeMonth(2);
            } else if (/g-selectable/.test(className)) {
                var regx = new RegExp(_this.activateClass, 'g');
                _this.removeClassName();
                if (!regx.test(className)) {
                    event.className = _this.activateClass + ' ' + event.className;
                }
            } else {
                // _this.removeClassName();
                // event.className = _this.activateClass + ' ' + event.className;
                // // event = {curDateText: curYear + '-' + curMonth}
                // _this.callBack(2, event);
            }
        })
    },
    removeClassName: function () {
        var activateClassDom = document.querySelectorAll('.' + this.activateClass);
        var reg = new RegExp(this.activateClass + ' ', 'g');
        for (var i = 0; i < activateClassDom.length; i++) {
            activateClassDom[i].className = activateClassDom[i].className.replace(reg, '');
        }
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
        var tagDate = new Date(year, month-1, day);
        return tagDate.getTime();
    },
    /**
     * 获取日期需要缓存的attr
     * @param {*} year 
     * @param {*} month 
     * @param {*} day 
     */
    getTargetTimeAttr(year, month, day) {
        var markData = this.markData;
        // console.error(markData);
        var attrObj = {};
        if (markData && markData.length > 1) {
            for (var i = 0; i < markData.length; i++) {
                var markTime = new Date(markData[i].date.replace(/\-/g, "/"));
                var markYear = markTime.getFullYear();
                var markMonth = markTime.getMonth()+1;
                var markDay = markTime.getDate();
                if (markYear == year && markMonth == month && markDay == day) {
                    attrObj.status = markData[i].status;
                    var firstAppearTime = this.getFirstAppearTime(markData, attrObj.status);
                    if (firstAppearTime && firstAppearTime.year == year && firstAppearTime.month == month && firstAppearTime.day == day) {
                        attrObj.isShowTips = true;
                    }
                    if (attrObj.status == 1 || attrObj.status == 2 || attrObj.status == 3) {
                        attrObj.isSelectable = true;
                    }
                    break;
                }
            }
        }
        return attrObj;
    },
    /**
     * 获取元素第一次出现的日期
     * @param {*} data 
     * @param {*} status 
     */
    getFirstAppearTime(data, status) {
        if (data.length > 1) {
            for (var i = 0; i < data.length; i++) {
                if (data[i].status == status) {
                    var tDate = new Date(data[i].date.replace(/\-/g, "/"));
                    return {
                        date: tDate,
                        year: tDate.getFullYear(),
                        month: tDate.getMonth()+1,
                        day: tDate.getDate()
                    };
                }
            }
        }
       return -1;
    }
}