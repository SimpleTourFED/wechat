/**
 * Created by ashbringer on 2017/2/16.
 */
if (!Array.prototype.indexOf)
{
    Array.prototype.indexOf = function(elt /*, from*/)
    {
        var len = this.length >>> 0;

        var from = Number(arguments[1]) || 0;
        from = (from < 0)
            ? Math.ceil(from)
            : Math.floor(from);
        if (from < 0)
            from += len;

        for (; from < len; from++)
        {
            if (from in this &&
                this[from] === elt)
                return from;
        }
        return -1;
    };
}
angular.module('ngPlugin',[])
.provider('alert', function () {
    var alertElement,confirmElement,timer;
    return {
        $get: ['$timeout', '$compile', '$rootScope', function ($timeout, $compile, $rootScope) {
            return {
                alert: function (options) {
                    var defaultOptions = {
                        reason: '此提示3秒后关闭',
                        message: '保存编辑失败，出现了错误哦！',
                        type: 'fail',
                        delay: '3'
                    };
                    var opts = angular.extend({}, defaultOptions, options);
                    var scope = $rootScope.$new(true);

                    if(alertElement){
                        alertElement.remove();
                        clearTimeout(timer);
                    }

                    var render = function(){
                        var template = '<div class="alertmsg"><div class="alertcontent"><div class="alertmsg_title">' +
                            opts.message + '</div><div class="alertmsg_detailed">' +
                            opts.reason + '</div></div></div>';

                        alertElement = $compile(template)(scope);
                        // scope.alertElement = alertElement;
                        angular.element('body').append(alertElement);
                        if (opts.type == 'success') {
                            alertElement.addClass('success');
                        }
                        alertElement.animate({top: '0'}, 500);
                        timer = setTimeout(scope.close,opts.delay*1000);
                    };

                    scope.close = function (event) {
                        alertElement.animate({top: '-100'}, 500, function () {
                            alertElement.remove();
                            clearTimeout(timer);
                        });
                        scope.$destroy();
                    };

                    return render();
                },
                confirm: function(options){
                    var defaultOptions = {
                        title : '确认删除？',
                        detailed : '该操作是不可逆的，是否仍然继续？',
                        no : '取  消',
                        yes : '确认删除',
                        delay : '3',
                        confirm : function(){},
                        cancel : function(){}
                    };
                    var opts = angular.extend({}, defaultOptions, options);
                    var scope = $rootScope.$new(true);

                    var removeConfirm = function(){
                        confirmElement.animate({bottom:'-64'}, opts.delay*100,function(){
                            confirmElement.remove();
                            confirmElement = null;
                        });
                    }

                    if(confirmElement){
                        confirmElement.remove();
                    }

                    var render = function(){
                        var template = '<div class="msgbox" style="bottom:-64px"><div><div class="msg_title">'+
                            opts.title+'</div><div class="msg_detailed">'+
                            opts.detailed+'</div></div><div><button ng-click="no($event)" class="msg_no">'+
                            opts.no+'</button><button ng-click="yes($event)" class="msg_yes">'+
                            opts.yes+'</button></div></div>';

                        confirmElement = $compile(template)(scope);
                        angular.element('body').append(confirmElement);
                        confirmElement.animate({bottom:'0'}, opts.delay*100);
                    }

                    scope.yes = function(){
                        opts.confirm();
                        removeConfirm();
                    }

                    scope.no = function(){
                        opts.cancel();
                        removeConfirm();
                    }

                    return render();
                }
            }
        }]
    }
})

//价格日历
.directive("datetimepicker",function(){
    return {
        restrict: "AC",
        require : "ngModel",
        link: function (scope, element, attrs, ctrl) {
            $(element).datetimepicker({
                lang:'ch',
                format : attrs.format?attrs.format:'Y-m-d',
                timepicker:attrs.hastime == 'true'?true:false,
                onClose : function(){
                    scope.$apply(function () {
                        ctrl.$setViewValue($(element).val());
                    });
                }
            });

        }
    }
})
//地图
.directive('stMap',function () {
    return {
        restrict: 'AC',
        scope:{
            lat:'=',
            lon:'=',
            address:'='
        },
        link:function (scope,element,attr) {
            var defaultPosition = {
                position: [104.072343, 30.663538],
                address: '四川省成都市青羊区西御河街道天府广场',
                zoom: 15
            };
            var $id = 'BMap'+parseInt(Math.random()*100000);
            $(element).attr('id',$id)
            var map = new BMap.Map($id);
            var dPoint = new BMap.Point(defaultPosition.position[0],defaultPosition.position[1]);
            map.centerAndZoom(dPoint,defaultPosition.zoom);
            map.setCurrentCity("成都");
            map.disableScrollWheelZoom(true);
            map.setDefaultCursor("pointer");
            map.addControl(new BMap.MapTypeControl());
            map.addControl(new BMap.ScaleControl({anchor: BMAP_ANCHOR_BOTTOM_LEFT}));
            map.addControl(new BMap.NavigationControl());
            map.addControl(new BMap.OverviewMapControl());
            var marker = new BMap.Marker(dPoint);
            var geocoder = new BMap.Geocoder(),flag=false
            map.addEventListener("click", function(e){
                var pt = e.point;
                geocoder.getLocation(pt, function(rs){
                    var addComp = rs.addressComponents;
                    addMarker(rs.point);
                    scope.address = addComp;
                    scope.$apply();
                });
            });
            function getPosition(address){
                geocoder.getPoint(address,function(pt){
                    if(pt){
                        geocoder_CallBack(address,pt);
                    }else{
                        alert("您选择地址没有解析到结果!");
                    }
                });
            }
            function getAddress(point){
                geocoder.getLocation(point,function(rs){
                    if(flag){
                        scope.mapaddress = rs.address;
                        flag = false;
                    }
                    map.clearOverlays();
                    marker = addMarker(point);
                });
            }
            function setPosition(lng, lat) {
                scope.longitude = lng;
                scope.latitude = lat;
                scope.$apply();
            }
            function addMarker(point){
                setPosition(point.lng,point.lat);
                map.centerAndZoom(point,15);
                // map.panTo(new BMap.Point(point.lng,point.lat));
                marker = new BMap.Marker(point);
                map.clearOverlays();
                map.addOverlay(marker);
                // map.setFitView();
                return marker;
            }
            function geocoder_CallBack(address,pt){
                setPosition(pt.lng,pt.lat);
                map.clearOverlays();
                marker = addMarker(pt);
            }
            scope.longitude && scope.latitude ? getAddress(new BMap.Point(scope.longitude,scope.latitude)):false
        }
    }
})
.directive('stHover',function () {
    return {
        restrict : 'AC',
        link:function (scope,element,attr) {
            angular.element(element).mouseenter(function () {
                $(this).addClass('hover');
            });
            angular.element(element).mouseleave(function () {
                $(this).removeClass('hover');
            })
        }
    }
})
.directive('stCheckbox',function(){
    return {
        restrict: 'AC',
        scope: {
            ngModel: '=',
            ngChecked:'='
        },
        link: function (scope, ele, attr) {
            if ($(ele).attr('disabled') == 'disabled') {
                h = '<span class="checkbox disabled-empty"></span>';
            }else{
                h = $(ele).is(':checked')?'<span class="checkbox selected"></span>':'<span class="checkbox"></span>';
            }
            $(ele).wrap(h);
            scope.$watch('ngModel', function () {
                if (angular.element(ele).is(':checked')) {
                    $(ele).attr('disabled') == 'disabled'?angular.element(ele).parents('.checkbox').addClass('disabled'):angular.element(ele).parents('.checkbox').addClass('selected');
                } else {
                    angular.element(ele).parents('.checkbox').removeClass('selected');
                }
            });
            scope.$watch('ngChecked', function () {
                if (angular.element(ele).is(':checked')) {
                    angular.element(ele).parents('.checkbox').addClass('selected');
                } else {
                    angular.element(ele).parents('.checkbox').removeClass('selected');
                }
            })
        }
    }
})
.directive('stRadio',function(){
    return {
        restrict: 'AC',
        scope: {
            ngModel: '='
        },
        link: function (scope, ele, attr) {
            if (angular.element(ele).is(':checked')) {
                angular.element(ele).wrap('<span class="selected radio"></span>');
            } else {
                angular.element(ele).wrap('<span class="radio"></span>');
            }
            scope.$watch('ngModel', function () {
                if (angular.element(ele).is(':checked')) {
                    angular.element(ele).parents('.radio').addClass('selected');
                } else {
                    angular.element(ele).parents('.radio').removeClass('selected');
                }
            })
        }
    }
})
.directive('stDropdown',function(){
    return {
        restrict : 'AC',
        scope:{
            n:'=n',
            width:'=width',
            model:'=ngModel',
            options:'=options',
            vkey : '@vkey',
            tkey : '@tkey'
        },
        link :function(scope,ele,attr){
            var $this = $(ele),h=scope.n?(scope.n*30)+'px':'150px',
                option = function(name,value,selected){
                    return $(selected?'<option selected></option>':'<option></option>').val(value).text(name)[0];
                },
                sync=function(){
                    var lis = [];
                    if(scope.options && scope.options.length){
                        $this.parents('.dropdown').show();
                    }else if(scope.options === undefined){
                        $this.parents('.dropdown').show();
                    }else{
                        $this.parents('.dropdown').hide();
                    }
                    if(scope.inherit){
                        $this.find('option').each(function() {
                            var attrList = $(this)[0].attributes;
                            var li = '<li ';
                            for(var i=0;i<attrList.length;i++){
                                li += attrList[i].name+'='+attrList[i].value+' ';
                            }
                            li+='>';
                            lis.push(li+$(this).text()+'</li>');
                        });
                    }else{
                        $this.find('option').each(function() {
                            lis.push('<li>'+$(this).text()+'</li>');
                        });
                    }
                    if(scope.model || scope.model == ''){
                        if( scope.model == ''){
                            $this.parents('.dropdown').find('.selected').html($this.find('option:first').text());
                        }else{
                            $this.parents('.dropdown').find('.selected').html($this.find('option[value='+scope.model+']').text());
                        }
                    }else{
                        $this.parents('.dropdown').find('.selected').html($this.find('option:selected').text());
                    }
                    $('ul',$this.parents('.dropdown')).empty().append(lis.join(''));
                    $('ul',$this.parents('.dropdown')).niceScroll({cursorborder:'',cursorcolor:'#000',cursoropacitymax:'0.5'});
                    $this.parents('.dropdown').find('li').hover(function(){
                        $(this).addClass('hover').siblings('li').removeClass('hover');
                    });
                    $this.parents('.dropdown').find('li').unbind('click').bind('click',function(event) {
                        var text =$(this).html();
                        var liIndex = $(this).index();
                        $this.parents('.dropdown').find('.selected').html(text);
                        scope.model = $this.parents('.dropdown').find('option').eq(liIndex).val();
                        scope.$apply();
                        $this.parents('.dropdown').find('select').val(scope.model);
                        $this.parents('.dropdown').find('div').hide();
                    });
                };
            if($this.parents('.dropdown').hasClass('dropdown')) return {};
            $this.wrap('<div class="dropdown"><span class="old"></span></div>').parents('.dropdown').width(scope.width);
            $this.parents('.dropdown').append('<span class="selected"></span><div style="height:'+h+'"><ul style="height:'+h+'"></ul></div>').find('.selected').width(scope.width-20);
            sync();
            $this.parents('.dropdown').hover(function() {
                $(this).find('div').show();
                $(this).addClass('radius');
                $('ul',$this.parents('.dropdown')).getNiceScroll().resize();
            }, function() {
                $(this).removeClass('radius');
                $(this).find('div').hide();
                $('ul',$this.parents('.dropdown')).getNiceScroll().resize();
            });
            if ($this.css('display')=='none') {
                $(this).removeClass('radius');
                $this.parents('.dropdown').hide();
            };
            scope.$watch('options',function(){
                setTimeout(sync,10);
            })
        }
    }
})