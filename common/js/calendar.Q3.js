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
            type : 'normal',
            month : '3',
            selectedFun : function() {}
        };
        params = params || {};
        for (var def in defaults) {
            if (typeof params[def] === 'undefined') {
                params[def] = defaults[def];
            }
        }
        _self.params = params;
        _self.index = 1; // 请求月份次数

        _self.get_title_html = function(title) {
            return '<div class="calendar-title">' + title + '</div>';
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
            for(var i = 0; i < data.length; i++) {
                if(data[i].day.split("-")[2] == day) {
                    var price = data[i].price;
                    var count = data[i].count;
                    var cardExchangeDays = data[i].cardExchangeDays;
                }
                var date = data[i].day.split("-")[0] + '-' + data[i].day.split("-")[1] + '-' + day;
            }
            return {
                price : price || 0,
                count : count || 0,
                date : date,
                cardExchangeDays : cardExchangeDays || 0
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
            $.ajax({
                type:'GET',
                url:'http://127.0.0.1:8080/common/js/data.json',
                beforeSend : function(){

                },
                data:{
                    id:_self.params.id,
                    start:start,
                    end:end
                },
                success: function(data) {
                    if(data.length) {
                        days_array.forEach(function(day_tr) {
                            html += '<div class="calendar-row">';
                            day_tr.forEach(function(day_td) {

                                var item = _self.getDayData(data,day_td);
                                var priceStr = item.price? '￥' + item.price : '-';
                                priceStr = day_td ? priceStr : '';

                                html += '<div class="calendar-col ' + 
                                    (item.count ? '' : 'disabled') + 
                                    (_self.params.type == 'normal' && item.count && _self.params.date.split('-')[0] + '-' + _self.params.date.split('-')[1] + '-' + (+_self.params.date.split('-')[2] + 1) == _self.dateArray[0] + '-' + _self.dateArray[1] + '-' + day_td ? 'selected' : '') + '"' +
                                    'data-stock="'+ item.count +'" ' +
                                    'data-date="'+item.date+'">' +
                                    '<div class="date">' + day_td + '</div>' +
                                    '<div class="price">' + priceStr + '</div>' +
                                    '</div>'
                            });
                            html +=  '</div>';
                        });
                        _self.params.$container.append(_self.get_title_html(_self.calendarTitle) + _self.get_weeks_html() + html);
                        _self.dom_control();
                    }
                },
                error: function() {

                },
                complete : function() {
                    _self.index++;
                    if(_self.index <= _self.params.month) {
                        var currentDate = new Date(_self.dateArray[0],_self.dateArray[1]-1,1);
                        var currentMonth = currentDate.getMonth() + 1;
                        currentDate.setMonth(currentMonth);

                        _self.params.date = currentDate.getFullYear() + '-' + (currentDate.getMonth()+1) + '-' +currentDate.getDate();
                        _self.render();
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
            // 非酒店价格日历绑定方法
            if(_self.params.type == 'normal') {
                // 初始选中第二天,没有库存则不选中
                var $selectedDate = $('.calendar-col.selected');
                if($selectedDate) {
                    _self.params.selectedFun($selectedDate);
                }
                $('.calendar-col').tap(function() {
                    var $this = $(this);
                    if(!$this.hasClass('disabled')) {
                        $('.calendar-col').removeClass('selected');
                        $this.addClass('selected');
                        _self.params.selectedFun($this);
                    }
                })
            } else if(_self.params.type == 'hotel') {
                $.alert({
                    msg: '请选择入住时间',
                })
            }

        };

        return _self;
    };
    $.calendar = function (params) {
        var calendar = new Calendar(params);
        calendar.render();
    };
}(Zepto);