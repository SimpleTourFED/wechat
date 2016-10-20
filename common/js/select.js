/**
 * Created by ashbringer on 16/5/20.
 */
+ function ($) {
    function Select(option,ele){
        var defaultOption = {
            options: false,
            title:'请选择',
            ok:function () {

            },
            date:false,
            address:false,
            target:false,
            type:'(key,value) in object'//(value,key) in object or (id as name) in array id为value,name为text
        };
        var _ = this;
        _.option = $.extend(defaultOption,option);
        _.ele = ele;
        _.$dom = '';
        _.flag = false;
        _.top = 0;
        _.top1 = 0;
        _.top2 = 0;
        _.startY = 0;
        _.endY = 0;
        _.provinceArray = ['',''];
        _.renderDate = function () {
            var date = $.trim(_.ele.text());
            if(date == ''){
                _.dateArray = ['1985','1','1'];
            }else{
                _.dateArray = date.replace(/\./g,'-').split('-');
            }
            _.$dom += '<div class="ios-select"><div class="ios-select-header"><button class="ios-select-cancel">取消</button>'+_.option.title+'<button class="ios-select-ok">确认</button></div><div class="ios-select-content">'+
                '<div class="ios-select-col"><div class="ios-select-col-wrapper">'+_.renderYear()+'</div></div>'+
                '<div class="ios-select-col"><div class="ios-select-col-wrapper">'+_.renderMonth()+'</div></div>'+
                '<div class="ios-select-col"><div class="ios-select-col-wrapper">'+_.renderDay()+'</div></div>'+
                '<div class="ios-select-highlight"></div></div></div>';

            // _.$dom = '<div class="ios-select-col"><div class="ios-select-col-wrapper">'+_.renderYear()+'</div></div>'+
            //         '<div class="ios-select-col"><div class="ios-select-col-wrapper">'+_.renderMonth()+'</div></div>'+
            //         '<div class="ios-select-col"><div class="ios-select-col-wrapper">'+_.renderDay()+'</div></div>';
        };
        _.renderAddress = function () {
            _.$dom += '<div class="ios-select"><div class="ios-select-header"><button class="ios-select-cancel">取消</button>'+_.option.title+'<button class="ios-select-ok">确认</button></div><div class="ios-select-content">'+
                '<div class="ios-select-col"><div class="ios-select-col-wrapper">'+_.renderProvince()+'</div></div>'+
                '<div class="ios-select-col"><div class="ios-select-col-wrapper">'+_.renderCity()+'</div></div>'+
                '<div class="ios-select-highlight"></div></div></div>';
        };
        _.renderProvince = function () {
            var $province = '';
            _.provinceId = 0;
            $.each($.province,function (i,item) {
                $province += '<div class="ios-select-col-item" data-value="'+i+'">'+item.name+'</div>'
            });
            _.provinceArray[0] = $.province[0].name;
            return $province;
        };
        _.renderCity = function () {
            var $city = '';
            $.each($.province[_.provinceId].city,function (i,item) {
                $city += '<div class="ios-select-col-item" data-value="'+i+'">'+item.name+'</div>'
            });
            _.provinceArray[1] = $.province[_.provinceId].city[0].name;
            return $city
        };
        _.renderYear = function () {
            var $year = '';
            for(var i = 1930;i<2021;i++){
                $year += '<div class="ios-select-col-item" data-value="'+i+'">'+i+'年</div>'
            }
            return $year
        };
        _.renderMonth = function () {
            var $month = '';
            for(var i = 1;i<13;i++){
                $month += '<div class="ios-select-col-item" data-value="'+i+'">'+i+'月</div>'
            }
            return $month;
        };
        _.renderDay = function () {
            var $date = new Date(_.dateArray[0],_.dateArray[1],0);
            var maxDay = $date.getDate();
            var $day = '';
            for(var i = 1;i<=maxDay;i++){
                $day += '<div class="ios-select-col-item" data-value="'+i+'">'+i+'日</div>'
            }
            return $day;
        };
        _.renderOptions = function(){
            _.options = '';
            _.option.type = _.option.type.replace(/\s{2,}/g,' ');
            if(_.option.type.indexOf('in object') > -1){
                var $first = _.option.type.indexOf('key')<_.option.type.indexOf('value')?'key':'value';
                for(var k in _.option.options){
                    var $value = $first == 'key'?k:_.option.options[k];
                    var $text = $first == 'key' ?_.option.options[k]:k;
                        _.options += '<div class="ios-select-col-item" data-value="'+$value+'">'+$text+'</div>'
                }
            }else if(_.option.type.indexOf('in array') > -1){
                _.option.type = _.option.type.slice(_.option.type.indexOf('(')+1,_.option.type.indexOf(')'));
                var $textKey = $.trim(_.option.type.split('as')[1]);
                var $valueKey = $.trim(_.option.type.split('as')[0]);
                $.each(_.option.options,function(i,item){
                    _.options += '<div class="ios-select-col-item" data-value="'+item[$valueKey]+'">'+item[$textKey]+'</div>'
                })
            }
        };
        _.render = function(){
            _.renderOptions();
            _.$dom += '<div class="ios-select"><div class="ios-select-header"><button class="ios-select-cancel">取消</button>'+_.option.title+'<button class="ios-select-ok">确认</button></div><div class="ios-select-content"><div class="ios-select-col"><div class="ios-select-col-wrapper">'+_.options+'</div></div><div class="ios-select-highlight"></div></div></div>'
        };
        _.init = function(){
            if(_.option.date){
                _.renderDate()
            }else if(_.option.address){
                _.renderAddress();
            }else{
                _.render();
            }
        };
        _.result = function () {
          if(_.option.date){
              return _.dateArray[0]+'-'+_.dateArray[1]+'-'+_.dateArray[2];
          }else if(_.option.address){
              if(_.provinceArray[0] === _.provinceArray[1]){
                  return _.provinceArray[0]
              }else{
                  return _.provinceArray[0]+'-'+_.provinceArray[1];
              }
          }
        };
        _.show = function(){
            var $dropdown = Select.prototype.show.call(_.$dom,_.ele,_.option);
            if($dropdown){
                _.$select = $dropdown;
                _.lengthFirst = _.$select.find('.ios-select-col').eq(0).find('.ios-select-col-item').length;
                _.$select.find('.ios-select-col')[0].addEventListener('touchstart',function(e){
                    _.startY = e.touches[0].pageY;
                    _.translate = 90-36*_.top;
                });
                _.$select.find('.ios-select-col')[0].addEventListener('touchmove',function(e){
                    e.preventDefault();
                    e.stopPropagation();
                    _.endY = e.touches[0].pageY;
                    var $translateY = _.translate -_.startY+_.endY;
                    _.top = Math.round((90-$translateY)/36);
                    if(_.top<0){
                        _.top = 0;
                    }else if(_.top>(_.lengthFirst-1)){
                        _.top = _.lengthFirst-1;
                    }
                    _.$select.find('.ios-select-col').eq(0).find('.ios-select-col-item').removeClass('ios-select-col-item-selected');
                    _.$select.find('.ios-select-col').eq(0).find('.ios-select-col-item').eq(_.top).addClass('ios-select-col-item-selected');
                    _.$select.find('.ios-select-col').eq(0).find('.ios-select-col-wrapper').css({'-webkit-transform':'translate3d(0,'+$translateY+'px,0)','transform':'translate3d(0,'+$translateY+'px,0)','-webkit-transition-duration':'0ms','transition-duration':'0ms'})
                });
                _.$select.find('.ios-select-col')[0].addEventListener('touchend',function(e){
                    var $translateY = 90-36*_.top;
                    _.$select.find('.ios-select-col').eq(0).find('.ios-select-col-wrapper').css({'-webkit-transform':'translate3d(0,'+$translateY+'px,0)','transform':'translate3d(0,'+$translateY+'px,0)','-webkit-transition-duration':'300ms','transition-duration':'300ms'})
                    if(_.option.date){
                        _.dateArray[0] = _.$select.find('.ios-select-col').eq(0).find('.ios-select-col-item-selected').attr('data-value');
                        setTimeout(function () {
                            _.$select.find('.ios-select-col').eq(2).find('.ios-select-col-wrapper').html(_.renderDay());
                            _.lengthThird = _.$select.find('.ios-select-col').eq(2).find('.ios-select-col-item').length;
                            var $valid = _.dateArray[2] > _.lengthThird ?_.lengthThird :_.dateArray[2];
                            _.dateArray[2] = $valid;
                            _.$select.find('.ios-select-col').eq(2).find('.ios-select-col-item').each(function (i,item) {
                                if($(item).attr('data-value')==$valid){
                                    _.top2 = i;
                                    $(item).addClass('ios-select-col-item-selected');
                                    var $translateY = 90-36*_.top2;
                                    _.$select.find('.ios-select-col').eq(2).find('.ios-select-col-wrapper').css({'-webkit-transform':'translate3d(0,'+$translateY+'px,0)','transform':'translate3d(0,'+$translateY+'px,0)','-webkit-transition-duration':'0ms','transition-duration':'0ms'})
                                }
                            });
                        },300)
                    }else if(_.option.address){
                        _.provinceArray[0] = _.$select.find('.ios-select-col').eq(0).find('.ios-select-col-item-selected').html();
                        _.provinceId = _.$select.find('.ios-select-col').eq(0).find('.ios-select-col-item-selected').attr('data-value');
                        setTimeout(function(){
                            _.$select.find('.ios-select-col').eq(1).find('.ios-select-col-wrapper').html(_.renderCity());
                            _.lengthSecond = _.$select.find('.ios-select-col').eq(1).find('.ios-select-col-item').length;
                            _.top1 = 0;
                            _.$select.find('.ios-select-col').eq(1).find('.ios-select-col-item').addClass('ios-select-col-item-selected');
                            var $translateY = 90-36*_.top1;
                            _.$select.find('.ios-select-col').eq(2).find('.ios-select-col-wrapper').css({'-webkit-transform':'translate3d(0,'+$translateY+'px,0)','transform':'translate3d(0,'+$translateY+'px,0)','-webkit-transition-duration':'0ms','transition-duration':'0ms'})
                        },300)
                    }

                });
                _.lengthSecond = _.$select.find('.ios-select-col').eq(1).find('.ios-select-col-item').length;
                _.$select.find('.ios-select-col')[1].addEventListener('touchstart',function(e){
                    _.startY = e.touches[0].pageY;
                    _.translate = 90-36*_.top1;
                });
                _.$select.find('.ios-select-col')[1].addEventListener('touchmove',function(e){
                    e.preventDefault();
                    e.stopPropagation();
                    _.endY = e.touches[0].pageY;
                    var $translateY = _.translate -_.startY+_.endY;
                    _.top1 = Math.round((90-$translateY)/36);
                    if(_.top1<0){
                        _.top1 = 0;
                    }else if(_.top1>(_.lengthSecond-1)){
                        _.top1 = _.lengthSecond-1;
                    }
                    _.$select.find('.ios-select-col').eq(1).find('.ios-select-col-item').removeClass('ios-select-col-item-selected');
                    _.$select.find('.ios-select-col').eq(1).find('.ios-select-col-item').eq(_.top1).addClass('ios-select-col-item-selected');
                    _.$select.find('.ios-select-col').eq(1).find('.ios-select-col-wrapper').css({'-webkit-transform':'translate3d(0,'+$translateY+'px,0)','transform':'translate3d(0,'+$translateY+'px,0)','-webkit-transition-duration':'0ms','transition-duration':'0ms'})
                });
                _.$select.find('.ios-select-col')[1].addEventListener('touchend',function(e){
                    var $translateY = 90-36*_.top1;
                    _.$select.find('.ios-select-col').eq(1).find('.ios-select-col-wrapper').css({'-webkit-transform':'translate3d(0,'+$translateY+'px,0)','transform':'translate3d(0,'+$translateY+'px,0)','-webkit-transition-duration':'300ms','transition-duration':'300ms'});
                    if(_.option.date){
                        _.dateArray[1] = _.$select.find('.ios-select-col').eq(1).find('.ios-select-col-item-selected').attr('data-value');
                        setTimeout(function () {
                            _.$select.find('.ios-select-col').eq(2).find('.ios-select-col-wrapper').html(_.renderDay());
                            _.lengthThird = _.$select.find('.ios-select-col').eq(2).find('.ios-select-col-item').length;
                            var $valid = _.dateArray[2] > _.lengthThird ?_.lengthThird :_.dateArray[2];
                            _.dateArray[2] = $valid;
                            _.$select.find('.ios-select-col').eq(2).find('.ios-select-col-item').each(function (i,item) {
                                if($(item).attr('data-value')==$valid){
                                    _.top2 = i;
                                    $(item).addClass('ios-select-col-item-selected');
                                    var $translateY = 90-36*_.top2;
                                    _.$select.find('.ios-select-col').eq(2).find('.ios-select-col-wrapper').css({'-webkit-transform':'translate3d(0,'+$translateY+'px,0)','transform':'translate3d(0,'+$translateY+'px,0)','-webkit-transition-duration':'0ms','transition-duration':'0ms'})
                                }
                            });
                        },300)
                    }else if(_.option.address){
                        _.provinceArray[1] = _.$select.find('.ios-select-col').eq(1).find('.ios-select-col-item-selected').html();
                    }

                });
                if(_.$select.find('.ios-select-col').length >= 3){
                    _.lengthThird = _.$select.find('.ios-select-col').eq(2).find('.ios-select-col-item').length;
                    _.$select.find('.ios-select-col')[2].addEventListener('touchstart',function(e){
                        _.startY = e.touches[0].pageY;
                        _.translate = 90-36*_.top2;
                    });
                    _.$select.find('.ios-select-col')[2].addEventListener('touchmove',function(e){
                        e.preventDefault();
                        e.stopPropagation();
                        _.endY = e.touches[0].pageY;
                        var $translateY = _.translate -_.startY+_.endY;
                        _.top2 = Math.round((90-$translateY)/36);
                        if(_.top2<0){
                            _.top2 = 0;
                        }else if(_.top2>(_.lengthThird-1)){
                            _.top2 = _.lengthThird-1;
                        }
                        _.$select.find('.ios-select-col').eq(2).find('.ios-select-col-item').removeClass('ios-select-col-item-selected');
                        _.$select.find('.ios-select-col').eq(2).find('.ios-select-col-item').eq(_.top2).addClass('ios-select-col-item-selected');
                        _.$select.find('.ios-select-col').eq(2).find('.ios-select-col-wrapper').css({'-webkit-transform':'translate3d(0,'+$translateY+'px,0)','transform':'translate3d(0,'+$translateY+'px,0)','-webkit-transition-duration':'0ms','transition-duration':'0ms'})
                    });
                    _.$select.find('.ios-select-col')[2].addEventListener('touchend',function(e){
                        var $translateY = 90-36*_.top2;
                        _.$select.find('.ios-select-col').eq(2).find('.ios-select-col-wrapper').css({'-webkit-transform':'translate3d(0,'+$translateY+'px,0)','transform':'translate3d(0,'+$translateY+'px,0)','-webkit-transition-duration':'300ms','transition-duration':'300ms'})
                        _.dateArray[2] = _.$select.find('.ios-select-col').eq(2).find('.ios-select-col-item-selected').attr('data-value');
                        // var str = _.dateArray[0]+'-'+_.dateArray[1]+'-'+_.dateArray[2];
                        // $(_.ele).html(str);
                        // $(_.ele).attr('value',str);
                    })
                }
            }
            if(_.option.date){
                _.$select.find('.ios-select-col').each(function (i,col) {
                    $(col).find('.ios-select-col-item').each(function (j,item) {
                        if($(item).attr('data-value')==_.dateArray[i]){
                            if(i==0){
                                _.top = j;
                                var $translateY = 90-36*_.top;
                            }else if(i == 1){
                                _.top1 = j;
                                var $translateY = 90-36*_.top1;
                            }else if(i == 2){
                                _.top2 = j;
                                var $translateY = 90-36*_.top2;
                            }
                            $(item).addClass('ios-select-col-item-selected');
                            $(col).find('.ios-select-col-wrapper').css({'-webkit-transform':'translate3d(0,'+$translateY+'px,0)','transform':'translate3d(0,'+$translateY+'px,0)','-webkit-transition-duration':'0ms','transition-duration':'0ms'})
                        }
                    });
                })
            }else if(_.option.address){
                _.$select.find('.ios-select-col').each(function (i,col) {
                    var $item = $(col).find('.ios-select-col-item').eq(0);
                    var $translateY = 90;
                    $item.addClass('ios-select-col-item-selected');
                    $(col).find('.ios-select-col-wrapper').css({'-webkit-transform':'translate3d(0,'+$translateY+'px,0)','transform':'translate3d(0,'+$translateY+'px,0)','-webkit-transition-duration':'0ms','transition-duration':'0ms'})
                });
            }else{
                _.$select.find('.ios-select-col-item').each(function (i,item) {
                    if($(item).attr('data-value')==$(_.ele).attr('value')){
                        _.top = i;
                        $(item).addClass('ios-select-col-item-selected');
                        var $translateY = 90-36*_.top;
                        _.$select.find('.ios-select-col-wrapper').css({'-webkit-transform':'translate3d(0,'+$translateY+'px,0)','transform':'translate3d(0,'+$translateY+'px,0)','-webkit-transition-duration':'0ms','transition-duration':'0ms'})
                    }
                })
            }
        }
    }
    Select.prototype.idArray = [];
    Select.prototype.classArray = ['ios-select-ok','ios-select','ios-select-header','ios-select-content','ios-select-col','ios-select-col-wrapper','ios-select-col-item'];
    Select.prototype.documentClickFlag = true;
    Select.prototype.index = 0;
    Select.prototype.domId = '';
    Select.prototype.close = function(){
        var $this = $('.ios-select').removeClass('ios-select-in');
        Select.prototype.domId = '';
        setTimeout(function(){
            $this.remove();
        },400);
    };
    Select.prototype.clickTarget = function(e){
        var classNames = $(e.target).attr('class');
        var idName = $(e.target).attr('id');
        if(classNames){
            classNames = classNames.split(' ');
        }else{
            classNames = [];
        }
        var flag = false;
        $.each(classNames,function(i,item){
            if(Select.prototype.classArray.indexOf(item) != -1){
                flag = true;
            }
        });
        if(Select.prototype.idArray.indexOf(idName) != -1){
            flag = true;
        }
        return !flag;
    };
    Select.prototype.show = function(ele,option){
        if(Select.prototype.domId == ''){
            var $this = $(this).appendTo('body');
            $this[0].clientLeft;
            $this.addClass('ios-select-in');
            Select.prototype.domId = $(ele).attr('id');
            $('.ios-select-header .ios-select-ok').click(function () {
                option.ok();
                Select.prototype.close();
            })
        }else if(Select.prototype.domId != '' && Select.prototype.domId != $(ele).attr('id')){
            Select.prototype.close();
            var $this = $(this).appendTo('body');
            $this[0].clientLeft;
            $this.addClass('ios-select-in');
            Select.prototype.domId = $(ele).attr('id');
        }
        if($this) return $this;
    };
    $.fn.select = function(option){
        var $select = new Select(option,$(this));
        $select.init();
        var $id = 'select'+Select.prototype.index+parseInt(Math.random()*10000);
        $(this).attr('id', $id);
        Select.prototype.idArray.push($id);
        // $(this).append(str);
        $(this).click(function(e){
            e.preventDefault();
            $select.show();
            // $select.toSelect();
        });
        if(Select.prototype.documentClickFlag){
            document.addEventListener('touchstart',function(e){
                Select.prototype.clickTarget(e)?Select.prototype.close():false;
            });
            Select.prototype.documentClickFlag = false;
        }
        return {result:$select.result};
    }
}(Zepto);