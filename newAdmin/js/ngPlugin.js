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
    .constant('u-remark',[['fullscreen', 'bold', 'underline', 'strikethrough', 'forecolor', 'backcolor','|', 'insertorderedlist', 'insertunorderedlist','|', 'removeformat', 'formatmatch','autotypeset', 'pasteplain', '|', 'selectall','undo', 'redo']])
    .constant('u-describe',[[ 'fullscreen', 'bold', 'underline', 'strikethrough', 'forecolor', 'backcolor','fontsize','|', 'insertorderedlist', 'insertunorderedlist','|', 'removeformat', 'formatmatch','autotypeset', 'pasteplain', '|', 'selectall','undo', 'redo','|','simpleupload']])
    .factory('$modalStack', ['$animate', '$timeout', '$document', '$compile', '$rootScope', '$$stackedMap',
        function ($animate, $timeout, $document, $compile, $rootScope, $$stackedMap) {

            var OPENED_MODAL_CLASS = 'modal-open';

            var backdropDomEl, backdropScope;
            var openedWindows = $$stackedMap.createNew();
            var $modalStack = {};

            function backdropIndex() {
                var topBackdropIndex = -1;
                var opened = openedWindows.keys();
                for (var i = 0; i < opened.length; i++) {
                    if (openedWindows.get(opened[i]).value.backdrop) {
                        topBackdropIndex = i;
                    }
                }
                return topBackdropIndex;
            }

            $rootScope.$watch(backdropIndex, function(newBackdropIndex){
                if (backdropScope) {
                    backdropScope.index = newBackdropIndex;
                }
            });

            function removeModalWindow(modalInstance) {

                var body = $document.find('body').eq(0);
                var modalWindow = openedWindows.get(modalInstance).value;

                //clean up the stack
                openedWindows.remove(modalInstance);

                //remove window DOM element
                removeAfterAnimate(modalWindow.modalDomEl, modalWindow.modalScope, function() {
                    body.toggleClass(OPENED_MODAL_CLASS, openedWindows.length() > 0);
                    checkRemoveBackdrop();
                });
            }

            function checkRemoveBackdrop() {
                //remove backdrop if no longer needed
                if (backdropDomEl && backdropIndex() == -1) {
                    var backdropScopeRef = backdropScope;
                    removeAfterAnimate(backdropDomEl, backdropScope, function () {
                        backdropScopeRef = null;
                    });
                    backdropDomEl = undefined;
                    backdropScope = undefined;
                }
            }

            function removeAfterAnimate(domEl, scope, done) {
                // Closing animation
                scope.animate = false;

                if (domEl.attr('modal-animation') && $animate.enabled()) {
                    // transition out
                    domEl.one('$animate:close', function closeFn() {
                        $rootScope.$evalAsync(afterAnimating);
                    });
                } else {
                    // Ensure this call is async
                    $timeout(afterAnimating);
                }

                function afterAnimating() {
                    if (afterAnimating.done) {
                        return;
                    }
                    afterAnimating.done = true;

                    domEl.remove();
                    scope.$destroy();
                    if (done) {
                        done();
                    }
                }
            }

            $document.bind('keydown', function (evt) {
                var modal;

                if (evt.which === 27) {
                    modal = openedWindows.top();
                    if (modal && modal.value.keyboard) {
                        evt.preventDefault();
                        $rootScope.$apply(function () {
                            $modalStack.dismiss(modal.key, 'escape key press');
                        });
                    }
                }
            });

            $modalStack.open = function (modalInstance, modal) {

                var modalOpener = $document[0].activeElement;

                openedWindows.add(modalInstance, {
                    deferred: modal.deferred,
                    renderDeferred: modal.renderDeferred,
                    modalScope: modal.scope,
                    backdrop: modal.backdrop,
                    keyboard: modal.keyboard
                });

                var body = $document.find('body').eq(0),
                    currBackdropIndex = backdropIndex();

                if (currBackdropIndex >= 0 && !backdropDomEl) {
                    backdropScope = $rootScope.$new(true);
                    backdropScope.index = currBackdropIndex;
                    var angularBackgroundDomEl = angular.element('<div modal-backdrop="modal-backdrop"></div>');
                    angularBackgroundDomEl.attr('backdrop-class', modal.backdropClass);
                    if (modal.animation) {
                        angularBackgroundDomEl.attr('modal-animation', 'true');
                    }
                    backdropDomEl = $compile(angularBackgroundDomEl)(backdropScope);
                    body.append(backdropDomEl);
                }

                var angularDomEl = angular.element('<div modal-window="modal-window"></div>');
                angularDomEl.attr({
                    'template-url': modal.windowTemplateUrl,
                    'window-class': modal.windowClass,
                    'size': modal.size,
                    'index': openedWindows.length() - 1,
                    'animate': 'animate'
                }).html(modal.content);
                if (modal.animation) {
                    angularDomEl.attr('modal-animation', 'true');
                }

                var modalDomEl = $compile(angularDomEl)(modal.scope);
                openedWindows.top().value.modalDomEl = modalDomEl;
                openedWindows.top().value.modalOpener = modalOpener;
                body.append(modalDomEl);
                body.addClass(OPENED_MODAL_CLASS);
            };

            function broadcastClosing(modalWindow, resultOrReason, closing) {
                return !modalWindow.value.modalScope.$broadcast('modal.closing', resultOrReason, closing).defaultPrevented;
            }

            $modalStack.close = function (modalInstance, result) {
                var modalWindow = openedWindows.get(modalInstance);
                if (modalWindow && broadcastClosing(modalWindow, result, true)) {
                    modalWindow.value.deferred.resolve(result);
                    removeModalWindow(modalInstance);
                    modalWindow.value.modalOpener.focus();
                    return true;
                }
                return !modalWindow;
            };

            $modalStack.dismiss = function (modalInstance, reason) {
                var modalWindow = openedWindows.get(modalInstance);
                if (modalWindow && broadcastClosing(modalWindow, reason, false)) {
                    modalWindow.value.deferred.reject(reason);
                    removeModalWindow(modalInstance);
                    modalWindow.value.modalOpener.focus();
                    return true;
                }
                return !modalWindow;
            };

            $modalStack.dismissAll = function (reason) {
                var topModal = this.getTop();
                while (topModal && this.dismiss(topModal.key, reason)) {
                    topModal = this.getTop();
                }
            };

            $modalStack.getTop = function () {
                return openedWindows.top();
            };

            $modalStack.modalRendered = function (modalInstance) {
                var modalWindow = openedWindows.get(modalInstance);
                if (modalWindow) {
                    modalWindow.value.renderDeferred.resolve();
                }
            };

            return $modalStack;
        }])
    .provider('$modal', function () {

        var $modalProvider = {
            options: {
                animation: true,
                backdrop: true, //can also be false or 'static'
                keyboard: true
            },
            $get: ['$injector', '$rootScope', '$q', '$http', '$templateCache', '$controller', '$modalStack',
                function ($injector, $rootScope, $q, $http, $templateCache, $controller, $modalStack) {

                    var $modal = {};

                    function getTemplatePromise(options) {
                        return options.template ? $q.when(options.template) :
                            $http.get(angular.isFunction(options.templateUrl) ? (options.templateUrl)() : options.templateUrl,
                                {cache: $templateCache}).then(function (result) {
                                return result.data;
                            });
                    }

                    function getResolvePromises(resolves) {
                        var promisesArr = [];
                        angular.forEach(resolves, function (value) {
                            if (angular.isFunction(value) || angular.isArray(value)) {
                                promisesArr.push($q.when($injector.invoke(value)));
                            }
                        });
                        return promisesArr;
                    }

                    $modal.open = function (modalOptions) {

                        var modalResultDeferred = $q.defer();
                        var modalOpenedDeferred = $q.defer();
                        var modalRenderDeferred = $q.defer();

                        //prepare an instance of a modal to be injected into controllers and returned to a caller
                        var modalInstance = {
                            result: modalResultDeferred.promise,
                            opened: modalOpenedDeferred.promise,
                            rendered: modalRenderDeferred.promise,
                            close: function (result) {
                                return $modalStack.close(modalInstance, result);
                            },
                            dismiss: function (reason) {
                                return $modalStack.dismiss(modalInstance, reason);
                            }
                        };

                        //merge and clean up options
                        modalOptions = angular.extend({}, $modalProvider.options, modalOptions);
                        modalOptions.resolve = modalOptions.resolve || {};

                        //verify options
                        if (!modalOptions.template && !modalOptions.templateUrl) {
                            throw new Error('One of template or templateUrl options is required.');
                        }

                        var templateAndResolvePromise =
                            $q.all([getTemplatePromise(modalOptions)].concat(getResolvePromises(modalOptions.resolve)));


                        templateAndResolvePromise.then(function resolveSuccess(tplAndVars) {

                            var modalScope = (modalOptions.scope || $rootScope).$new();
                            modalScope.$close = modalInstance.close;
                            modalScope.$dismiss = modalInstance.dismiss;

                            var ctrlInstance, ctrlLocals = {};
                            var resolveIter = 1;

                            //controllers
                            if (modalOptions.controller) {
                                ctrlLocals.$scope = modalScope;
                                ctrlLocals.$modalInstance = modalInstance;
                                angular.forEach(modalOptions.resolve, function (value, key) {
                                    ctrlLocals[key] = tplAndVars[resolveIter++];
                                });

                                ctrlInstance = $controller(modalOptions.controller, ctrlLocals);
                                if (modalOptions.controllerAs) {
                                    modalScope[modalOptions.controllerAs] = ctrlInstance;
                                }
                            }

                            $modalStack.open(modalInstance, {
                                scope: modalScope,
                                deferred: modalResultDeferred,
                                renderDeferred: modalRenderDeferred,
                                content: tplAndVars[0],
                                animation: modalOptions.animation,
                                backdrop: modalOptions.backdrop,
                                keyboard: modalOptions.keyboard,
                                backdropClass: modalOptions.backdropClass,
                                windowClass: modalOptions.windowClass,
                                windowTemplateUrl: modalOptions.windowTemplateUrl,
                                size: modalOptions.size
                            });

                        }, function resolveError(reason) {
                            modalResultDeferred.reject(reason);
                        });

                        templateAndResolvePromise.then(function () {
                            modalOpenedDeferred.resolve(true);
                        }, function (reason) {
                            modalOpenedDeferred.reject(reason);
                        });

                        return modalInstance;
                    };

                    return $modal;
                }]
        };

        return $modalProvider;
    })
    .factory('$$stackedMap', function () {
        return {
            createNew: function () {
                var stack = [];

                return {
                    add: function (key, value) {
                        stack.push({
                            key: key,
                            value: value
                        });
                    },
                    get: function (key) {
                        for (var i = 0; i < stack.length; i++) {
                            if (key == stack[i].key) {
                                return stack[i];
                            }
                        }
                    },
                    keys: function() {
                        var keys = [];
                        for (var i = 0; i < stack.length; i++) {
                            keys.push(stack[i].key);
                        }
                        return keys;
                    },
                    top: function () {
                        return stack[stack.length - 1];
                    },
                    remove: function (key) {
                        var idx = -1;
                        for (var i = 0; i < stack.length; i++) {
                            if (key == stack[i].key) {
                                idx = i;
                                break;
                            }
                        }
                        return stack.splice(idx, 1)[0];
                    },
                    removeTop: function () {
                        return stack.splice(stack.length - 1, 1)[0];
                    },
                    length: function () {
                        return stack.length;
                    }
                };
            }
        };
    })
    .directive('modalBackdrop', ['$timeout', function ($timeout) {
        return {
            restrict: 'EA',
            replace: true,
            templateUrl: '/newAdmin/view/backdrop.html',
            compile: function (tElement, tAttrs) {
                tElement.addClass(tAttrs.backdropClass);
                return linkFn;
            }
        };

        function linkFn(scope, element, attrs) {
            scope.animate = false;

            //trigger CSS transitions
            $timeout(function () {
                scope.animate = true;
            });
        }
    }])
    .directive('modalWindow', ['$modalStack', '$q','$modal', function ($modalStack, $q,$modal) {
        return {
            restrict: 'EA',
            scope: {
                index: '@',
                animate: '='
            },
            replace: true,
            transclude: true,
            templateUrl: function(tElement, tAttrs) {
                return tAttrs.templateUrl || '/newAdmin/view/window.html';
            },
            link: function (scope, element, attrs) {
                element.addClass(attrs.windowClass || '');
                scope.size = attrs.size;

                scope.close = function (evt) {
                    var modal = $modalStack.getTop();
                    if (modal && modal.value.backdrop && modal.value.backdrop != 'static' && (evt.target === evt.currentTarget)) {
                        evt.preventDefault();
                        evt.stopPropagation();
                        $modalStack.dismiss(modal.key, 'backdrop click');
                    }
                };

                // This property is only added to the scope for the purpose of detecting when this directive is rendered.
                // We can detect that by using this property in the template associated with this directive and then use
                // {@link Attribute#$observe} on it. For more details please see {@link TableColumnResize}.
                scope.$isRendered = true;

                // Deferred object that will be resolved when this modal is render.
                var modalRenderDeferObj = $q.defer();
                // Observe function will be called on next digest cycle after compilation, ensuring that the DOM is ready.
                // In order to use this way of finding whether DOM is ready, we need to observe a scope property used in modal's template.
                attrs.$observe('modalRender', function (value) {
                    if (value == 'true') {
                        modalRenderDeferObj.resolve();
                    }
                });

                modalRenderDeferObj.promise.then(function () {
                    // trigger CSS transitions
                    scope.animate = true;

                    var inputsWithAutofocus = element[0].querySelectorAll('[autofocus]');
                    /**
                     * Auto-focusing of a freshly-opened modal element causes any child elements
                     * with the autofocus attribute to lose focus. This is an issue on touch
                     * based devices which will show and then hide the onscreen keyboard.
                     * Attempts to refocus the autofocus element via JavaScript will not reopen
                     * the onscreen keyboard. Fixed by updated the focusing logic to only autofocus
                     * the modal element if the modal does not contain an autofocus element.
                     */
                    if (inputsWithAutofocus.length) {
                        inputsWithAutofocus[0].focus();
                    } else {
                        element[0].focus();
                    }

                    // Notify {@link $modalStack} that modal is rendered.
                    var modal = $modalStack.getTop();
                    if (modal) {
                        $modalStack.modalRendered(modal.key);
                    }
                });
            }
        };
    }])
    .directive('modalAnimationClass', [
        function () {
            return {
                compile: function (tElement, tAttrs) {
                    if (tAttrs.modalAnimation) {
                        tElement.addClass(tAttrs.modalAnimationClass);
                    }
                }
            };
        }])
    .directive('modalTransclude', function () {
        return {
            link: function($scope, $element, $attrs, controller, $transclude) {
                $transclude($scope.$parent, function(clone) {
                    $element.empty();
                    $element.append(clone);
                });
            }
        };
    })
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
                            content : '确认删除？',
                            no : '取消',
                            yes : '确定',
                            delay : '3',
                            confirm : function(){},
                            cancel : function(){}
                        };
                        var opts = angular.extend({}, defaultOptions, options);
                        var scope = $rootScope.$new(true);

                        var removeConfirm = function(){
                            confirmElement.remove();
                            confirmElement = null;
                        };

                        if(confirmElement){
                            confirmElement.remove();
                        }

                        var render = function(){
                            var template = '<div class="modal-backdrop fade in"></div><div class="confirm-bg">'+
                                '<div class="confirm-container"><div class="confirm-content">'+opts.content+
                                '</div><div class="confirm-footer"><button ng-click="no($event)" class="cancel" st-hover=""><span class="icon"></span><span>'+opts.no+'</span>'+
                                '</button><button class="ok" ng-click="yes($event)" st-hover=""><span class="icon"></span><span>'+opts.yes+'</span>'+
                                '</button></div></div></div>';

                            confirmElement = $compile(template)(scope);
                            angular.element('body').append(confirmElement);
                        };

                        scope.yes = function($event){
                            $event.preventDefault();
                            opts.confirm();
                            removeConfirm();
                        };

                        scope.no = function($event){
                            $event.preventDefault();
                            opts.cancel();
                            removeConfirm();
                        };

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
                $(element).attr('id',$id);
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
                var geocoder = new BMap.Geocoder(),flag=false;
                map.addEventListener("click", function(e){
                    var pt = e.point;
                    geocoder.getLocation(pt, function(rs){
                        var addComp = rs.addressComponents;
                        addMarker(rs.point);
                        scope.address.province = addComp.province;
                        scope.address.city = addComp.city;
                        scope.address.district = addComp.district;
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
                    if(!$(this).hasClass('nohover')){
                        $(this).addClass('hover');
                    }
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
                        $('ul',$this.parents('.dropdown')).niceScroll({cursorborder:'',cursorcolor:'#E0E6EB',cursoropacitymax:'0.5'});
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
                $this.parents('.dropdown').append('<span class="selected"></span><div style="height:'+h+'"><ul style="height:'+h+'"></ul></div>').find('.selected').width(scope.width-42);
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
    .directive('stValidate',['$window', '$compile', '$timeout', '$document',function($window,$compile,$timeout,$document){
        return {
            restrict : 'AC',
            scope:{
                validateMax : '=validateMax',
                validateMaxMsg : '@validateMaxMsg',
                validateMin : '@validateMin',
                validateMinMsg : '@validateMinMsg',
                validateNotBlankMsg : '@validateNotBlankMsg',
                validateMobileMsg : '@validateMobileMsg',
                validateIdNoMsg : '@validateIdNoMsg',
                validateIdNoType:'@validateIdNoType',
                validateEmailMsg:'@validateEmailMsg',
                validateAlphabetMsg:'@validateAlphabetMsg',
                validateLenMin :'@validateLenMin',
                validateLenMinMsg:'@validateLenMinMsg',
                validateLenMax:'@validateLenMax',
                validateLenMaxMsg:'@validateLenMaxMsg',
                validateLenEqual:'@validateLenEqual',
                validateLenEqualMsg:'@validateLenEqualMsg',
                validatePast:'=validatePast',
                validatePastMsg:'@validatePastMsg',
                validateRepeat:'=validateRepeat',
                validateRepeatMsg:'@validateRepeatMsg',
                validateNumberMsg:'@validateNumberMsg',
                validateAllNumberMsg:'@validateAllNumberMsg',
                validateLicense: '@validateLicense',
                validateLicenseMsg: '@validateLicenseMsg',
                validatePositiveNumberMsg:'@validatePositiveNumberMsg',
                validateColorMsg: '@validateColorMsg',
                validateDecimal: '@validateDecimal',
                validateDecimalMsg: '@validateDecimalMsg'
            },
            require:'ngModel',
            transclude: true,
            template:'<input ng-transclude ng-class="{error:$parent[fname][vname].$invalid && $parent[fname][vname].$dirty}"/>',
            replace:true,
            link:function(scope,ele,attr,ctrl){
                angular.element(ele).focusin(function(){
                    ctrl.$dirty = true;
                    ctrl.$pristine = false;
                });
                var Vname = scope.$parent.$eval(attr.dyName) || attr.dyName ||  attr.name;
                scope.vname = scope.$parent.$eval(attr.dyName) || attr.dyName || attr.name;
                scope.fname = angular.element(ele).parents('form').attr('name');
                var vFlag = true;
                function getTrigger(trigger){
                    var show = trigger || defaultOptions.trigger;
                    var hide = triggerMap[show] || show;
                    return {
                        show : show,
                        hide : hide
                    }
                }
                var validateId = function(idCard){
                    var pass = true;
                    //15位和18位身份证号码的正则表达式
                    var regIdCard=/^(^[1-9]\d{7}((0\d)|(1[0-2]))(([0|1|2]\d)|3[0-1])\d{3}$)|(^[1-9]\d{5}[1-9]\d{3}((0\d)|(1[0-2]))(([0|1|2]\d)|3[0-1])((\d{4})|\d{3}[Xx])$)$/;
                    //如果通过该验证，说明身份证格式正确，但准确性还需计算
                    if(regIdCard.test(idCard)){
                        if(idCard.length==18){
                            var idCardWi=new Array( 7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2 ); //将前17位加权因子保存在数组里
                            var idCardY=new Array( 1, 0, 10, 9, 8, 7, 6, 5, 4, 3, 2 ); //这是除以11后，可能产生的11位余数、验证码，也保存成数组
                            var idCardWiSum=0; //用来保存前17位各自乖以加权因子后的总和
                            for(var i=0;i<17;i++){
                                idCardWiSum+=idCard.substring(i,i+1)*idCardWi[i];
                            }
                            var idCardMod=idCardWiSum%11;//计算出校验码所在数组的位置
                            var idCardLast=idCard.substring(17);//得到最后一位身份证号码
                            //如果等于2，则说明校验码是10，身份证号码最后一位应该是X
                            if(idCardMod==2){
                                if(idCardLast=="X"||idCardLast=="x"){

                                }else{
                                    pass = false
                                }
                            }else{
                                //用计算出的验证码与最后一位身份证号码匹配，如果一致，说明通过，否则是无效的身份证号码
                                if(idCardLast==idCardY[idCardMod]){

                                }else{
                                    pass = false;
                                }
                            }
                        }else{
                            pass = false;
                        }
                    }else{
                        pass = false;
                    }
                    return pass;
                };
                scope.validateArray = [];
                function validate(value,ngCtrl,flag,name,scope){
                    //最大值
                    if(scope.validateMax && scope.validateMaxMsg){
                        if(!value || parseFloat(value) <= parseFloat(scope.validateMax)){
                            scope.validateArray.push({status:true,msg:scope.validateMaxMsg})
                            ngCtrl.$setValidity(name+'_max',true);
                        }else{
                            scope.validateArray.push({status:false,msg:scope.validateMaxMsg})
                            ngCtrl.$setValidity(name+'_max',false);
                            flag = false;
                        }
                    }
                    //最小值
                    if(scope.validateMin && scope.validateMinMsg){
                        if(parseFloat(value) >= parseFloat(scope.validateMin)){
                            scope.validateArray.push({status:true,msg:scope.validateMinMsg})
                            ngCtrl.$setValidity(name+'_min',true);
                        }else{
                            scope.validateArray.push({status:false,msg:scope.validateMinMsg})
                            ngCtrl.$setValidity(name+'_min',false);
                            flag = false
                        }
                    }
                    //不能为空
                    if(scope.validateNotBlankMsg){
                        if($.trim(value)!=''){
                            scope.validateArray.push({status:true,msg:scope.validateNotBlankMsg})
                            ngCtrl.$setValidity(name+'_blank',true);
                        }else{
                            scope.validateArray.push({status:false,msg:scope.validateNotBlankMsg})
                            ngCtrl.$setValidity(name+'_blank',false);
                            flag = false
                        }
                    }
                    //mobile
                    if(scope.validateMobileMsg){
                        if(/^0?(13|14|15|17|18)[0-9]{9}$/.test(value)){
                            scope.validateArray.push({status:true,msg:scope.validateMobileMsg})
                            ngCtrl.$setValidity(name+'_mobile',true);
                        }else if(/^0[0-9]{9}$/.test(value)){
                            scope.validateArray.push({status:true,msg:scope.validateMobileMsg})
                            ngCtrl.$setValidity(name+'_mobile',true);
                        }else{
                            scope.validateArray.push({status:false,msg:scope.validateMobileMsg})
                            ngCtrl.$setValidity(name+'_mobile',false);
                            flag = false;
                        }
                    }
                    //idNo
                    if(scope.validateIdNoMsg){
                        if(!scope.validateIdNoType || scope.validateIdNoType == 'idNo'){
                            if(validateId(value)){
                                scope.validateArray.push({status:true,msg:scope.validateIdNoMsg})
                                ngCtrl.$setValidity(name+'_id',true);
                            }else{
                                scope.validateArray.push({status:false,msg:scope.validateIdNoMsg})
                                ngCtrl.$setValidity(name+'_id',false);
                                flag = false;
                            }
                        }else{
                            scope.validateArray.push({status:true,msg:scope.validateIdNoMsg})
                            ngCtrl.$setValidity(name+'_id',true);
                        }
                    }
                    //email
                    if(scope.validateEmailMsg){
                        if(value=='' || /^([a-zA-Z0-9_-])+@([a-zA-Z0-9_-])+((\.[a-zA-Z0-9_-]{2,3}){1,2})$/.test(value)){
                            scope.validateArray.push({status:true,msg:scope.validateEmailMsg})
                            ngCtrl.$setValidity(name+'_email',true);
                        }else{
                            scope.validateArray.push({status:false,msg:scope.validateEmailMsg})
                            ngCtrl.$setValidity(name+'_email',false);
                            flag = false;
                        }
                    }
                    //Alphabet
                    if(scope.validateAlphabetMsg){
                        if(/^[a-zA-Z0-9]*$/.test(value)){
                            scope.validateArray.push({status:true,msg:scope.validateAlphabetMsg})
                            ngCtrl.$setValidity(name+'_alphabet',true);
                        }else{
                            scope.validateArray.push({status:false,msg:scope.validateAlphabetMsg})
                            ngCtrl.$setValidity(name+'_alphabet',false);
                            flag = false;
                        }
                    }
                    //字符串长度最小值
                    if(scope.validateLenMin && scope.validateLenMinMsg){
                        var vLen = (angular.isNumber(value) || angular.isString(value))?value.toString().length:0;
                        if(vLen.length >= parseInt(scope.validateLenMin)){
                            scope.validateArray.push({status:true,msg:scope.validateLenMinMsg})
                            ngCtrl.$setValidity(name+'_lenmin',true);
                        }else{
                            scope.validateArray.push({status:false,msg:scope.validateLenMinMsg})
                            ngCtrl.$setValidity(name+'_lenmin',false);
                            flag = false;
                        }
                    }
                    //字符串长度最大值
                    if(scope.validateLenMax && scope.validateLenMaxMsg){
                        var vLen = (angular.isNumber(value) || angular.isString(value))?value.toString().length:0;
                        if(vLen <= parseInt(scope.validateLenMax)){
                            scope.validateArray.push({status:true,msg:scope.validateLenMaxMsg})
                            ngCtrl.$setValidity(name+'_lenmax',true);
                        }else{
                            scope.validateArray.push({status:false,msg:scope.validateLenMaxMsg})
                            ngCtrl.$setValidity(name+'_lenmax',false);
                            flag = false;
                        }
                    }
                    //字符串长度为某一确定值
                    if(scope.validateLenEqual && scope.validateLenEqualMsg){
                        if(value.length == parseInt(scope.validateLenEqual)){
                            scope.validateArray.push({status:true,msg:scope.validateLenEqualMsg})
                            ngCtrl.$setValidity(name+'_lenequal',true);
                        }else{
                            scope.validateArray.push({status:false,msg:scope.validateLenEqualMsg})
                            ngCtrl.$setValidity(name+'_lenequal',false);
                            flag = false;
                        }
                    }
                    //相同性验证
                    if(scope.validateRepeatMsg){
                        if(value == scope.validateRepeat){
                            scope.validateArray.push({status:true,msg:scope.validateRepeatMsg})
                            ngCtrl.$setValidity(name+'_repeat',true);
                        }else{
                            scope.validateArray.push({status:false,msg:scope.validateRepeatMsg})
                            ngCtrl.$setValidity(name+'_repeat',false);
                            flag = false;
                        }
                    }
                    //过去时验证
                    if(scope.validatePast && scope.validatePastMsg){
                        if(value > scope.validatePast){
                            scope.validateArray.push({status:true,msg:scope.validatePastMsg})
                            ngCtrl.$setValidity(name+'_past',true);
                        }else{
                            scope.validateArray.push({status:false,msg:scope.validatePastMsg})
                            ngCtrl.$setValidity(name+'_past',false);
                            flag = false;
                        }
                    }
                    //数字验证
                    if(scope.validateNumberMsg){
                        if(/^[0-9]\d*(\.\d+)?$/.test(value) || value == ''){
                            scope.validateArray.push({status:true,msg:scope.validateNumberMsg})
                            ngCtrl.$setValidity(name+'_num',true);
                        }else{
                            scope.validateArray.push({status:false,msg:scope.validateNumberMsg})
                            ngCtrl.$setValidity(name+'_num',false);
                            flag = false;
                        }
                    }
                    //数字验证(包括负数)
                    if(scope.validateAllNumberMsg){
                        if(/^-?[0-9]\d*(\.\d+)?$/.test(value) || value == ''){
                            scope.validateArray.push({status:true,msg:scope.validateAllNumberMsg})
                            ngCtrl.$setValidity(name+'_num',true);
                        }else{
                            scope.validateArray.push({status:false,msg:scope.validateAllNumberMsg})
                            ngCtrl.$setValidity(name+'_num',false);
                            flag = false;
                        }
                    }
                    //正整数验证
                    if(scope.validatePositiveNumberMsg){
                        if(/^[0-9]\d*?$/.test(value) || value == ''){
                            scope.validateArray.push({status:true,msg:scope.validatePositiveNumberMsg})
                            ngCtrl.$setValidity(name+'_num',true);
                        }else{
                            scope.validateArray.push({status:false,msg:scope.validatePositiveNumberMsg})
                            ngCtrl.$setValidity(name+'_num',false);
                            flag = false;
                        }
                    }
                    // 颜色验证
                    if(scope.validateColorMsg){
                        if(/^[0-9a-fA-F]{6}$/.test(value) || value == ''){
                            scope.validateArray.push({status:true,msg:scope.validateColorMsg})
                            ngCtrl.$setValidity(name+'_num',true);
                        }else{
                            scope.validateArray.push({status:false,msg:scope.validateColorMsg})
                            ngCtrl.$setValidity(name+'_num',false);
                            flag = false;
                        }
                    }
                    // 车牌号验证
                    if(scope.validateLicenseMsg) {
                        if(/^[\u4e00-\u9fa5][A-Z]{1}[A-Z0-9]{5}$/.test(value)) {
                            scope.validateArray.push({status:true,msg:scope.validateLicenseMsg});
                            ngCtrl.$setValidity(name+'_license',true);
                        } else {
                            scope.validateArray.push({status:false,msg:scope.validateLicenseMsg});
                            ngCtrl.$setValidity(name+'_license',false);
                            flag = false;
                        }
                    }
                    //最多保留多少位小数验证
                    if(scope.validateDecimal && scope.validateDecimalMsg){
                        var reg = new RegExp("^[0-9]+(\.[0-9]{0,"+parseInt(scope.validateDecimal)+"})?$","gim");
                        if(reg.test(value) || value == '') {
                            scope.validateArray.push({status:true,msg:scope.validateDecimalMsg});
                            ngCtrl.$setValidity(name+'_decimal',true);
                        } else {
                            scope.validateArray.push({status:false,msg:scope.validateDecimalMsg});
                            ngCtrl.$setValidity(name+'_decimal',false);
                            flag = false;
                        }
                    }
                    return flag;
                }
                if(scope.validateRepeatMsg){
                    scope.$watch('validateRepeat',function(){
                        var viewValue = ctrl.$viewValue;
                        vFlag = true;
                        scope.validateArray = [];
                        vFlag = validate(viewValue,ctrl,vFlag,Vname,scope);
                        scope.validate = vFlag;
                        if(vFlag){
                            ctrl.$setValidity(Vname+'_validate',true);
                        }else{
                            ctrl.$setValidity(Vname+'_validate',false);
                        }
                        // ttScope.validateArray = scope.validateArray;
                        return viewValue
                    })
                }
                //angular.element(ele).keyup(function(){
                //    $(this).val($(this).val().replace(/[^0-9]*/g,''))
                //})
                ctrl.$parsers.unshift(function(viewValue){
                    if(scope.validatePositiveNumberMsg){
                        viewValue = viewValue.replace(/[^0-9]*/g,'');
                        viewValue = viewValue?viewValue:'';
                        angular.element(ele).val(viewValue);
                    }
                    vFlag = true;
                    scope.validateArray = [];
                    vFlag = validate(viewValue,ctrl,vFlag,Vname,scope);
                    scope.validate = vFlag;
                    if(vFlag){
                        ctrl.$setValidity(Vname+'_validate',true);
                    }else{
                        ctrl.$setValidity(Vname+'_validate',false);
                    }
                    // ttScope.validateArray = scope.validateArray;
                    return viewValue
                });
                ctrl.$formatters.unshift(function(viewValue){
                    vFlag = true;
                    scope.validateArray = [];
                    vFlag = validate(viewValue,ctrl,vFlag,Vname,scope);
                    scope.validate = vFlag;
                    if(vFlag){
                        ctrl.$setValidity(Vname+'_validate',true);
                    }else{
                        ctrl.$setValidity(Vname+'_validate',false);
                    }
                    // ttScope.validateArray = scope.validateArray;
                    return viewValue
                });
                var defaultOptions = {
                    placement : 'right',
                    trigger : 'click',
                    show : 'false'
                };
                var triggerMap = {
                    'mouseenter' : 'mouseleave',
                    'focus' : 'blur',
                    'click' : 'click'
                };
                var tooltip;
                var template = '<div class="input_tips" ng-class="{valid:validate}"><div class="arrow"></div><div class="content"><ul><li ng-repeat="i in validateArray" ng-class="{error:!i.status}">{{i.msg}}</li></ul></div></div>';
                var positionTooltip = function(){
                    var ttPosition = angular.element(ele).offset();
                    angular.element(tooltip).css({
                        top: ttPosition.top+'px',
                        left: ttPosition.left+angular.element(ele).outerWidth()+15+'px'
                    });
                };
                function show(){
                    tooltip = $compile(template)(scope,function(tooltip){
                        $document.find('body').append(tooltip);
                    });
                    scope.$apply();
                    positionTooltip();
                }
                function hide(){
                    if(tooltip){
                        tooltip.remove();
                        tooltip = null;
                    }
                }
                var triggers = getTrigger(attr.trigger);
                var placement = attr.placement || defaultOptions.placement;
                angular.element(ele).bind(triggers.show,show);
                angular.element(ele).bind(triggers.hide,hide);
            }
        }
    }])
    .directive("dyName",function() {
        return {
            require: "ngModel",
            link: function(scope, elm, iAttrs, ngModelCtr) {
                ngModelCtr.$name = scope.$eval(iAttrs.dyName) || iAttrs.dyName;
                var formController = elm.controller('form') || {
                        $addControl: angular.noop
                    };
                formController.$addControl(ngModelCtr);
                scope.$on('$destroy', function() {
                    formController.$removeControl(ngModelCtr);
                });

            }
        };
    })
    .directive('stTextareaValidate',['$window', '$compile', '$timeout', '$document',function($window,$compile,$timeout,$document){
        return {
            restrict : 'AC',
            scope:{
                validateNotBlankMsg : '@validateNotBlankMsg',
                validateLenMin :'@validateLenMin',
                validateLenMinMsg:'@validateLenMinMsg',
                validateLenMax:'@validateLenMax',
                validateLenMaxMsg:'@validateLenMaxMsg'
            },
            require:'ngModel',
            transclude: true,
            template:'<textarea ng-transclude ng-class="{error:$parent[fname][vname].$invalid && $parent[fname][vname].$dirty}"></textarea>',
            replace:true,
            link:function(scope,ele,attr,ctrl){
                angular.element(ele).focusin(function(){
                    ctrl.$dirty = true;
                    ctrl.$pristine = false;
                })
                var Vname = scope.$parent.$eval(attr.dyName) || attr.dyName ||  attr.name;
                scope.vname = scope.$parent.$eval(attr.dyName) || attr.dyName || attr.name;
                scope.fname = angular.element(ele).parents('form').attr('name');
                var vFlag = true;
                function getTrigger(trigger){
                    var show = trigger || defaultOptions.trigger;
                    var hide = triggerMap[show] || show;
                    return {
                        show : show,
                        hide : hide
                    }
                }
                scope.validateArray = [];
                function validate(value,ngCtrl,flag,name,scope){
                    //不能为空
                    if(scope.validateNotBlankMsg){
                        if($.trim(value)!=''){
                            scope.validateArray.push({status:true,msg:scope.validateNotBlankMsg})
                            ngCtrl.$setValidity(name+'_blank',true);
                        }else{
                            scope.validateArray.push({status:false,msg:scope.validateNotBlankMsg})
                            ngCtrl.$setValidity(name+'_blank',false);
                            flag = false
                        }
                    }
                    //字符串长度最小值
                    if(scope.validateLenMin && scope.validateLenMinMsg){
                        if(value.length >= parseInt(scope.validateLenMin)){
                            scope.validateArray.push({status:true,msg:scope.validateLenMinMsg})
                            ngCtrl.$setValidity(name+'_lenmin',true);
                        }else{
                            scope.validateArray.push({status:false,msg:scope.validateLenMinMsg})
                            ngCtrl.$setValidity(name+'_lenmin',false);
                            flag = false;
                        }
                    }
                    //字符串长度最大值
                    if(scope.validateLenMax && scope.validateLenMaxMsg){
                        if(value.length <= parseInt(scope.validateLenMax)){
                            scope.validateArray.push({status:true,msg:scope.validateLenMaxMsg})
                            ngCtrl.$setValidity(name+'_lenmax',true);
                        }else{
                            scope.validateArray.push({status:false,msg:scope.validateLenMaxMsg})
                            ngCtrl.$setValidity(name+'_lenmax',false);
                            flag = false;
                        }
                    }
                    return flag;
                }
                ctrl.$parsers.unshift(function(viewValue){
                    vFlag = true;
                    scope.validateArray = [];
                    vFlag = validate(viewValue,ctrl,vFlag,Vname,scope);
                    scope.validate = vFlag;
                    if(vFlag){
                        ctrl.$setValidity(Vname+'_validate',true);
                    }else{
                        ctrl.$setValidity(Vname+'_validate',false);
                    }
                    // ttScope.validateArray = scope.validateArray;
                    return viewValue
                })
                ctrl.$formatters.unshift(function(viewValue){
                    vFlag = true;
                    scope.validateArray = [];
                    vFlag = validate(viewValue,ctrl,vFlag,Vname,scope);
                    scope.validate = vFlag;
                    if(vFlag){
                        ctrl.$setValidity(Vname+'_validate',true);
                    }else{
                        ctrl.$setValidity(Vname+'_validate',false);
                    }
                    // ttScope.validateArray = scope.validateArray;
                    return viewValue
                });
                var defaultOptions = {
                    placement : 'right',
                    trigger : 'click',
                    show : 'false'
                };
                var triggerMap = {
                    'mouseenter' : 'mouseleave',
                    'focus' : 'blur',
                    'click' : 'click'
                };
                var tooltip;
                var template = '<div class="input_tips" ng-class="{valid:validate}"><div class="arrow"></div><div class="content"><ul><li ng-repeat="i in validateArray" ng-class="{error:!i.status}">{{i.msg}}</li></ul></div></div>';
                var positionTooltip = function(){
                    var ttPosition = angular.element(ele).offset();
                    angular.element(tooltip).css({
                        top: ttPosition.top+'px',
                        left: ttPosition.left+angular.element(ele).outerWidth()+6+'px'
                    });
                }
                function show(){
                    tooltip = $compile(template)(scope,function(tooltip){
                        $document.find('body').append(tooltip);
                    })
                    scope.$apply();
                    positionTooltip();
                }
                function hide(){
                    if(tooltip){
                        tooltip.remove();
                        tooltip = null;
                    }
                }
                var triggers = getTrigger(attr.trigger);
                var placement = attr.placement || defaultOptions.placement;
                angular.element(ele).bind(triggers.show,show);
                angular.element(ele).bind(triggers.hide,hide);
            }
        }
    }])
    .directive('stUeditor', ['u-remark','u-describe',function (uRemark,uDescribe) {
        return {
            restrict: 'AC',
            transclude: true,
            replace: true,
            template: '<script name="content" type="text/plain" ng-transclude>GGG</script>',
            require: '?ngModel',
            scope: {
                config: '@',
                setdisabled: '@'
            },
            link: function (scope, element, attrs, ngModel) {
                // 不含图片
                var config = {
                    toolbars: uRemark
                };
                if(scope.setdisabled) {
                    config.readonly = true;
                }
                if(!scope.config || scope.config == 'normal') {
                } else if(scope.config == 'upload') {
                    config.toolbars = uDescribe;
                    config.serverUrl = attrs.url || '/config_product';
                } else {
                    config = scope.config;
                }
                var editor = new UE.ui.Editor(config);
                editor.render(element[0]);
                if(scope.setdisabled) {
                    editor.setDisabled([]);
                }
                if (ngModel) {
                    //Model数据更新时，更新百度UEditor
                    ngModel.$render = function () {
                        editor.ready(function() {
                            if (scope.setdisabled) {
                                editor.setDisabled([]);
                            }
                            editor.setContent(ngModel.$viewValue?ngModel.$viewValue:'');
                        });
                    };


                    //百度UEditor数据更新时，更新Model
                    editor.addListener('contentChange', function () {
                        setTimeout(function () {
                            scope.$apply(function () {
                                ngModel.$setViewValue(editor.getContent());
                            })
                        }, 0);
                    })
                    editor.addListener('imgSuccess',function(){
                        setTimeout(function () {
                            scope.$apply(function () {
                                ngModel.$setViewValue(editor.getContent());
                            })
                        }, 0);
                    })
                }
            }
        }
    }])
    .directive('stPaging', function () {


        /**
         * The regex expression to use for any replace methods
         * Feel free to tweak / fork values for your application
         */
        var regex = /\{page\}/g;


        /**
         * The angular return value required for the directive
         * Feel free to tweak / fork values for your application
         */
        return {

            // Restrict to elements and attributes
            restrict: 'EA',

            // Assign the angular link function
            link: fieldLink,

            // Assign the angular directive template HTML
            template: fieldTemplate,

            // Assign the angular scope attribute formatting
            scope: {
                page: '=',
                pageSize: '=',
                total: '=',
                disabled: '@',
                dots: '@',
                ulClass: '@',
                activeClass: '@',
                disabledClass: '@',
                adjacent: '@',
                pagingAction: '&',
                pgHref: '@',
                textFirst: '@',
                textLast: '@',
                textNext: '@',
                textPrev: '@',
                textFirstClass: '@',
                textLastClass: '@',
                textNextClass: '@',
                textPrevClass: '@',
                textTitlePage: '@',
                textTitleFirst: '@',
                textTitleLast: '@',
                textTitleNext: '@',
                textTitlePrev: '@'
            }

        };


        /**
         * Link the directive to enable our scope watch values
         *
         * @param {object} scope - Angular link scope
         * @param {object} el - Angular link element
         * @param {object} attrs - Angular link attribute
         */
        function fieldLink(scope, el, attrs) {

            // Hook in our watched items
            scope.$watchCollection('[page,pageSize,total,disabled]', function () {
                build(scope, attrs);
            });
        }


        /**
         * Create our template html
         * We use a function to figure out how to handle href correctly
         *
         * @param {object} el - Angular link element
         * @param {object} attrs - Angular link attribute
         */
        function fieldTemplate(el, attrs){
            return '<ul data-ng-hide="Hide" data-ng-class="ulClass"> ' +
                '<li ' +
                'title="{{Item.title}}" ' +
                'data-ng-class="Item.liClass" ' +
                'data-ng-repeat="Item in List"> ' +
                '<a ' +
                (attrs.pgHref ? 'data-ng-href="{{Item.pgHref}}" ' : 'href ') +
                'data-ng-class="Item.aClass" ' +
                'data-ng-click="Item.action()" ' +
                'data-ng-bind="Item.value">'+
                '</a> ' +
                '</li>' +
                '</ul>'
        }


        /**
         * Assign default scope values from settings
         * Feel free to tweak / fork these for your application
         *
         * @param {Object} scope - The local directive scope object
         * @param {Object} attrs - The local directive attribute object
         */
        function setScopeValues(scope, attrs) {

            scope.List = [];
            scope.Hide = false;

            scope.page = parseInt(scope.page) || 1;
            scope.total = parseInt(scope.total) || 0;
            scope.adjacent = parseInt(scope.adjacent) || 2;

            scope.pgHref = scope.pgHref || '';
            scope.dots = scope.dots || '...';

            scope.ulClass = scope.ulClass || 'pagination';
            scope.activeClass = scope.activeClass || 'active';
            scope.disabledClass = scope.disabledClass || 'disabled';

            scope.textFirst = scope.textFirst || '<<';
            scope.textLast = scope.textLast || '>>';
            scope.textNext = scope.textNext || '下一页';
            scope.textPrev = scope.textPrev || '上一页';

            scope.textFirstClass = scope.textFirstClass || '';
            scope.textLastClass= scope.textLastClass || '';
            scope.textNextClass = scope.textNextClass || '';
            scope.textPrevClass = scope.textPrevClass || '';

            scope.textTitlePage = scope.textTitlePage || 'Page {page}';
            scope.textTitleFirst = scope.textTitleFirst || 'First Page';
            scope.textTitleLast = scope.textTitleLast || 'Last Page';
            scope.textTitleNext = scope.textTitleNext || 'Next Page';
            scope.textTitlePrev = scope.textTitlePrev || 'Previous Page';

            scope.hideIfEmpty = evalBoolAttribute(scope, attrs.hideIfEmpty);
            scope.showPrevNext = evalBoolAttribute(scope, attrs.showPrevNext);
            scope.showFirstLast = evalBoolAttribute(scope, attrs.showFirstLast);
            scope.scrollTop = evalBoolAttribute(scope, attrs.scrollTop);
            scope.isDisabled = evalBoolAttribute(scope, attrs.disabled);
        }


        /**
         * A helper to perform our boolean eval on attributes
         * This allows flexibility in the attribute for strings and variables in scope
         *
         * @param {Object} scope - The local directive scope object
         * @param {Object} value - The attribute value of interest
         */
        function evalBoolAttribute(scope, value){
            return angular.isDefined(value)
                ? !!scope.$parent.$eval(value)
                : false;
        }


        /**
         * Validate and clean up any scope values
         * This happens after we have set the scope values
         *
         * @param {Object} scope - The local directive scope object
         * @param {int} pageCount - The last page number or total page count
         */
        function validateScopeValues(scope, pageCount) {

            // Block where the page is larger than the pageCount
            if (scope.page > pageCount) {
                scope.page = pageCount;
            }

            // Block where the page is less than 0
            if (scope.page <= 0) {
                scope.page = 1;
            }

            // Block where adjacent value is 0 or below
            if (scope.adjacent <= 0) {
                scope.adjacent = 2;
            }

            // Hide from page if we have 1 or less pages
            // if directed to hide empty
            if (pageCount <= 1) {
                scope.Hide = scope.hideIfEmpty;
            }
        }


        /**
         * Assign the method action to take when a page is clicked
         *
         * @param {Object} scope - The local directive scope object
         * @param {int} page - The current page of interest
         */
        function internalAction(scope, page) {

            // Block clicks we try to load the active page
            if (scope.page == page) {
                return;
            }

            // Block if we are forcing disabled
            if(scope.isDisabled)
            {
                return;
            }

            // Update the page in scope
            scope.page = page;

            // Pass our parameters to the paging action
            scope.pagingAction({
                page: scope.page,
                pageSize: scope.pageSize,
                total: scope.total
            });

            // If allowed scroll up to the top of the page
            if (scope.scrollTop) {
                scrollTo(0, 0);
            }
        }


        /**
         * Add the first, previous, next, and last buttons if desired
         * The logic is defined by the mode of interest
         * This method will simply return if the scope.showPrevNext is false
         * This method will simply return if there are no pages to display
         *
         * @param {Object} scope - The local directive scope object
         * @param {int} pageCount - The last page number or total page count
         * @param {string} mode - The mode of interest either prev or last
         */
        function addPrevNext(scope, pageCount, mode) {

            // Ignore if we are not showing
            // or there are no pages to display
            if ((!scope.showPrevNext && !scope.showFirstLast) || pageCount < 1) {
                return;
            }

            // Local variables to help determine logic
            var disabled, alpha, beta;

            // Determine logic based on the mode of interest
            // Calculate the previous / next page and if the click actions are allowed
            if (mode === 'prev') {

                disabled = scope.page - 1 <= 0;
                var prevPage = scope.page - 1 <= 0 ? 1 : scope.page - 1;

                if(scope.showFirstLast){
                    alpha = {
                        value: scope.textFirst,
                        title: scope.textTitleFirst,
                        aClass: scope.textFirstClass,
                        page: 1
                    };
                }

                if(scope.showPrevNext){
                    beta = {
                        value: scope.textPrev,
                        title: scope.textTitlePrev,
                        aClass: scope.textPrevClass,
                        page: prevPage
                    };
                }

            } else {

                disabled = scope.page + 1 > pageCount;
                var nextPage = scope.page + 1 >= pageCount ? pageCount : scope.page + 1;

                if(scope.showPrevNext){
                    alpha = {
                        value: scope.textNext,
                        title: scope.textTitleNext,
                        aClass: scope.textNextClass,
                        page: nextPage
                    };
                }

                if(scope.showFirstLast){
                    beta = {
                        value: scope.textLast,
                        title: scope.textTitleLast,
                        aClass: scope.textLastClass,
                        page: pageCount
                    };
                }

            }

            // Create the Add Item Function
            var buildItem = function (item, disabled) {
                return {
                    title: item.title,
                    aClass: item.aClass,
                    value:  item.value,
                    liClass: disabled ? scope.disabledClass : '',
                    pgHref: disabled ? '' : scope.pgHref.replace(regex, item.page),
                    action: function () {
                        if (!disabled) {
                            internalAction(scope, item.page);
                        }
                    }
                };
            };

            // Force disabled if specified
            if(scope.isDisabled){
                disabled = true;
            }

            // Add alpha items
            if(alpha){
                var alphaItem = buildItem(alpha, disabled);
                scope.List.push(alphaItem);
            }

            // Add beta items
            if(beta){
                var betaItem = buildItem(beta, disabled);
                scope.List.push(betaItem);
            }
        }


        /**
         * Adds a range of numbers to our list
         * The range is dependent on the start and finish parameters
         *
         * @param {int} start - The start of the range to add to the paging list
         * @param {int} finish - The end of the range to add to the paging list
         * @param {Object} scope - The local directive scope object
         */
        function addRange(start, finish, scope) {

            // Add our items where i is the page number
            var i = 0;
            for (i = start; i <= finish; i++) {

                var pgHref = scope.pgHref.replace(regex, i);
                var liClass = scope.page == i ? scope.activeClass : '';

                // Handle items that are affected by disabled
                if(scope.isDisabled){
                    pgHref = '';
                    liClass = scope.disabledClass;
                }


                scope.List.push({
                    value: i,
                    title: scope.textTitlePage.replace(regex, i),
                    liClass: liClass,
                    pgHref: pgHref,
                    action: function () {
                        internalAction(scope, this.value);
                    }
                });
            }
        }


        /**
         * Add Dots ie: 1 2 [...] 10 11 12 [...] 56 57
         * This is my favorite function not going to lie
         *
         * @param {Object} scope - The local directive scope object
         */
        function addDots(scope) {
            scope.List.push({
                value: scope.dots,
                liClass: scope.disabledClass
            });
        }


        /**
         * Add the first or beginning items in our paging list
         * We leverage the 'next' parameter to determine if the dots are required
         *
         * @param {Object} scope - The local directive scope object
         * @param {int} next - the next page number in the paging sequence
         */
        function addFirst(scope, next) {

            addRange(1, 2, scope);

            // We ignore dots if the next value is 3
            // ie: 1 2 [...] 3 4 5 becomes just 1 2 3 4 5
            if (next != 3) {
                addDots(scope);
            }
        }


        /**
         * Add the last or end items in our paging list
         * We leverage the 'prev' parameter to determine if the dots are required
         *
         * @param {int} pageCount - The last page number or total page count
         * @param {Object} scope - The local directive scope object
         * @param {int} prev - the previous page number in the paging sequence
         */
        // Add Last Pages
        function addLast(pageCount, scope, prev) {

            // We ignore dots if the previous value is one less that our start range
            // ie: 1 2 3 4 [...] 5 6  becomes just 1 2 3 4 5 6
            if (prev != pageCount - 2) {
                addDots(scope);
            }

            addRange(pageCount - 1, pageCount, scope);
        }



        /**
         * The main build function used to determine the paging logic
         * Feel free to tweak / fork values for your application
         *
         * @param {Object} scope - The local directive scope object
         * @param {Object} attrs - The local directive attribute object
         */
        function build(scope, attrs) {

            // Block divide by 0 and empty page size
            if (!scope.pageSize || scope.pageSize <= 0) {
                scope.pageSize = 1;
            }

            // Determine the last page or total page count
            var pageCount = Math.ceil(scope.total / scope.pageSize);

            // Set the default scope values where needed
            setScopeValues(scope, attrs);

            // Validate the scope values to protect against strange states
            validateScopeValues(scope, pageCount);

            // Create the beginning and end page values
            var start, finish;

            // Calculate the full adjacency value
            var fullAdjacentSize = (scope.adjacent * 2) + 2;


            // Add the Next and Previous buttons to our list
            addPrevNext(scope, pageCount, 'prev');

            // If the page count is less than the full adjacnet size
            // Then we simply display all the pages, Otherwise we calculate the proper paging display
            if (pageCount <= (fullAdjacentSize + 2)) {

                start = 1;
                addRange(start, pageCount, scope);

            } else {

                // Determine if we are showing the beginning of the paging list
                // We know it is the beginning if the page - adjacent is <= 2
                if (scope.page - scope.adjacent <= 2) {

                    start = 1;
                    finish = 1 + fullAdjacentSize;

                    addRange(start, finish, scope);
                    addLast(pageCount, scope, finish);
                }

                // Determine if we are showing the middle of the paging list
                // We know we are either in the middle or at the end since the beginning is ruled out above
                // So we simply check if we are not at the end
                // Again 2 is hard coded as we always display two pages after the dots
                else if (scope.page < pageCount - (scope.adjacent + 2)) {

                    start = scope.page - scope.adjacent;
                    finish = scope.page + scope.adjacent;

                    addFirst(scope, start);
                    addRange(start, finish, scope);
                    addLast(pageCount, scope, finish);
                }

                // If nothing else we conclude we are at the end of the paging list
                // We know this since we have already ruled out the beginning and middle above
                else {

                    start = pageCount - fullAdjacentSize;
                    finish = pageCount;

                    addFirst(scope, start);
                    addRange(start, finish, scope);
                }
            }

            // Add the next and last buttons to our paging list
            addPrevNext(scope, pageCount, 'next');
        }

    })