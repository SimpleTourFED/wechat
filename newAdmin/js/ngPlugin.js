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