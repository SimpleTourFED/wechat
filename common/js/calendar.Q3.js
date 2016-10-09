/*======================================================
 ************   Calendar   ************
 ======================================================*/
+function ($) {
    "use strict";
    var Calendar = function (params) {
        var _self = this;
        var defaults = {
            weekNames: ['日', '一', '二', '三', '四', '五', '六'],
            $container:'',
            date : '',
            type : 'tourism',
            stockType : 'normal', // hotel 酒店日历
            postData: {},
            month : '3',
            isReload : false,
            selectedFun : function() {}
        };
        params = params || {};
        for (var def in defaults) {
            if (typeof params[def] === 'undefined') {
                params[def] = defaults[def];
            }
        }
        _self.params = params;
        _self.index = _self.params.index || 1; // 请求月份次数
        _self.nextDate = new Date(_self.params.date.split("-")[0],_self.params.date.split("-")[1]-1,+_self.params.date.split("-")[2] + 1); // 当前日期的下一天

        _self.get_title_html = function(title) {
            return '<div class="calendar" id="'+_self.index+'"><div class="calendar-title">' + title + '</div>';
        };

        _self.get_weeks_html = function() {
            var html = '<div class="calendar-weeks"><ul>';
            for(var i = 0, item; item = _self.params.weekNames[i++];) {
                html += '<li>' + item + '</li>';
            }
            html += '</ul></div>';
            return html;
        };
        _self.getDayData = function(data,day) {
            if(data && data.length) {
                for(var i = 0; i < data.length; i++) {
                    if(data[i].date.split("-")[2] == day) {
                        var price = data[i].adultSettlement;
                        var count = data[i].availableNum;
                        var cardExchangeDays = data[i].cardExchangeDays;
                    }
                    var date = data[i].date.split("-")[0] + '-' + data[i].date.split("-")[1] + '-' + day;
                }
                return {
                    price : price || 0,
                    count : count || 0,
                    date : date,
                    cardExchangeDays : cardExchangeDays || 0
                }
            }  else {
                return {
                    price : 0,
                    count : 0,
                    date : _self.dateArray[0] + '-' + _self.dateArray[1] + '-' + day
                }
            }

        };
        _self.render = function() {
            var html = '';
            var days_array = _self.get_days_array();

            _self.dateArray = _self.params.date.split('-');
            _self.calendarTitle = _self.dateArray[0] + '年' + _self.dateArray[1] + '月';

            var currentDate = _self.dateArray ? new Date(+_self.dateArray[0],_self.dateArray[1],0,0,0,0) : new Date();
            var days = currentDate.getDate();
            var start = _self.dateArray[0] + '-' + _self.dateArray[1] + '-' + '1';
            var end = _self.dateArray[0] + '-' + _self.dateArray[1] + '-' + days;
            _self.params.postData.start = start;
            _self.params.postData.end = end;
            $.ajax({
                type:'POST',
                url:_self.params.url,
                beforeSend : function(){
                    // 进页面提示选择入住日期
                    if(_self.index == 1) {
                        $.preloader.show();
                    }
                },
                data:_self.params.postData,
                success: function(data) {
                    var jsonData = JSON.parse(data);
                    if(jsonData.code == 0 || jsonData.code == 2) {
                        days_array.forEach(function(day_tr) {
                            html += '<div class="calendar-row">';
                            day_tr.forEach(function(day_td) {

                                var item = _self.getDayData(jsonData.data,day_td);
                                var priceStr = item.price? '￥' + item.price : '-';
                                priceStr = day_td ? priceStr : '';

                                html += '<div class="calendar-col ' +
                                    (item.count ? 'available' : 'disabled') +
                                    (_self.index == 1 && _self.dateArray[2] == day_td ? ' today' : '') +
                                    (_self.params.stockType == 'normal' && _self.index == 1 && item.count && _self.nextDate.getTime() == new Date(_self.dateArray[0],_self.dateArray[1]-1,day_td).getTime() ? ' selected' : '') + '"' +
                                    'data-stock="'+ item.count +'" ' +
                                    'data-date="'+item.date+'">' +
                                    '<div class="date">' + (_self.index == 1 && _self.dateArray[2] == day_td ? '今天' : day_td) + '</div>' +
                                    '<div class="price">' + priceStr + '</div>' +
                                    '</div>'
                            });
                            html +=  '</div>';
                        });
                        html +=  '</div>';
                        if($("#"+_self.index).length) {
                            $("#"+_self.index).html(_self.get_title_html(_self.calendarTitle) + _self.get_weeks_html() + html);
                        } else {
                            _self.params.$container.append(_self.get_title_html(_self.calendarTitle) + _self.get_weeks_html() + html);
                        }
                    }
                },
                error: function() {
                    var dayHtml = '<div class="no_content">加载价格日历失败，<span class="refresh" data-index="'+_self.index+'">点击重试！</span></div>';
                    _self.params.$container.append(_self.get_title_html(_self.calendarTitle) + _self.get_weeks_html() + dayHtml);
                    var index = _self.index;
                    var date = _self.params.date;
                    $(".refresh[data-index='"+_self.index+"']").on('tap',function() {
                        _self.params.date = date;
                        _self.params.index = index;
                        _self.params.isReload = true;
                        var calendar = new Calendar(params);
                        calendar.render();
                    })
                },
                complete : function() {
                    $.preloader.hide();
                    if(!_self.params.isReload){
                        _self.index++;
                        if(_self.index <= _self.params.month) {
                            var currentDate = new Date(_self.dateArray[0],_self.dateArray[1]-1,1);
                            var currentMonth = currentDate.getMonth() + 1;
                            currentDate.setMonth(currentMonth);

                            _self.params.date = currentDate.getFullYear() + '-' + (currentDate.getMonth()+1) + '-' +currentDate.getDate();
                            _self.render();
                        } else {
                            $.preloader.hide();
                            if(_self.params.stockType == 'hotel') {
                                $.alert({
                                    msg: '请选择入住时间'
                                });
                            }
                            _self.dom_control();
                        }
                    }
                }
            });

            return html;
        };
        // 转化二维数组
        _self.get_days_array = function() {
            var dateArray = _self.params.date.split('-');
            var date = new Date(dateArray[0],dateArray[1] - 1,dateArray[2]);
            date.setDate(1);
            var blank_day = date.getDay(); //当前月星期一是周几
            var month = date.getMonth();
            date.setMonth(month + 1);
            date.setDate(0);

            var days_array = [];
            var totalCount = blank_day + date.getDate();
            var day_tr_no = totalCount%7==0 ? parseInt(totalCount/7):parseInt(totalCount/7)+1;
            for(var i = 0; i < day_tr_no; i++) {
                days_array.push([]);
            }
            // 生成月前空白天
            for(var x = 0; x < blank_day; x++) {
                days_array[0].push('');
            }
            var index = 0;
            for(var j = 0; j < date.getDate(); j++) {
                days_array[index].push(j+1);
                if(days_array[index].length == 7) {
                    index++;
                }
            }
            // 生成月后空白天
            var lastArrayLen = days_array[days_array.length-1].length;
            for(var y = 0; y < 7 - lastArrayLen; y++) {
                days_array[days_array.length-1].push('');
            }

            return days_array;
        };
        _self.dom_control = function() {
            // 字符串转date
            var toDate = function(string) {
                var date;
                if(string) {
                    var stringArray = string.split('-');
                    date = new Date(+stringArray[0],+stringArray[1]-1,+stringArray[2],0,0,0);
                }
                return date;
            };
            // 非酒店价格日历绑定方法
            if(_self.params.stockType == 'normal') {
                // 初始选中第二天,没有库存则不选中
                var $selectedDate = $('.calendar-col.selected');
                if($selectedDate) {
                    _self.params.selectedFun($selectedDate);
                }
                $('.calendar-col.available').tap(function() {
                    var $this = $(this);
                    $('.calendar-col').removeClass('selected');
                    $this.addClass('selected');
                    _self.params.selectedFun($this);
                })
            } else if(_self.params.stockType == 'hotel') {
                var clickIndex = 1; // 记录点击次数
                var $start,$end,startCache,endCache;

                $('.calendar-col').tap(function() {
                    var $this = $(this);
                    if(clickIndex == 1 && $this.hasClass('available')) {
                        $start = $(this);
                        $start.addClass('start selected hotelSelected');
                        startCache = $start.find('.date').text();
                        $start.find('.date').text('入住');
                        $.alert({
                            msg: '请选择离店时间'
                        });
                        clickIndex++;
                    } else if(clickIndex == 2) {
                        $end = $(this);
                        var startDate = $start.attr('data-date');
                        var endDate = $end.attr('data-date');
                        if(toDate(startDate) >= toDate(endDate) && $end.hasClass('available')) {
                            $start.removeClass('start selected hotelSelected');
                            $start = $end;
                            $start.addClass('start selected hotelSelected');
                        } else if(toDate(startDate) <= toDate(endDate)){
                            var dayArray = [];
                            $('.calendar-col').forEach(function (days) {
                                var date = $(days).attr('data-date');
                                if(date.split('-')[2]) {
                                    if(toDate(date) >= toDate(startDate) && toDate(date) < toDate(endDate)) {
                                        dayArray.push(days);
                                    }
                                }
                            });

                            var noStock = false;
                            // 判断所选时间段中是否存在无库存产品
                            dayArray.forEach(function(item) {
                                if ($(item).hasClass('disabled')) {
                                    noStock = true;
                                }
                            });

                            if(noStock) {
                                $.alert({
                                    msg: '您所选日期范围库存不足'
                                });
                            } else {
                                $end.addClass('end selected hotelSelected');
                                endCache = $end.find('.date').text();
                                $end.find('.date').text('离店');
                                dayArray.forEach(function(item) {
                                    $(item).addClass('hotelSelected');
                                });
                                clickIndex++;
                                _self.params.selectedFun(dayArray);
                            }
                        }
                    } else if(clickIndex == 3 && $this.hasClass('available')) {
                        // 第三次点击则置空之前所选，并作为start日期
                        $start.removeClass('start selected hotelSelected');
                        $start.find('.date').text(startCache);
                        $end.removeClass('end selected');
                        $end.find('.date').text(endCache);
                        $('.hotelSelected').removeClass('selected hotelSelected');
                        clickIndex = 2;
                        $start = $(this);
                        $start.addClass('start selected hotelSelected');
                    }

                });
            }

        };

        return _self;
    };
    $.calendar = function (params) {
        var calendar = new Calendar(params);
        calendar.render();
    };
}(Zepto);