/**
 * Created by ashbringer on 16/5/18.
 */

//alert.js
(function($){
    function Modal(option,type){
        var _ = this;
        _.type = type;
        var defaultOption = {
            msg : '这里是错误提示',
            title:'这里是标题',
            detail : ['这里是描述'],
            yes : '确定',
            cancel: false,
            yesFun:function(){},
            cancelFun:function(){}
        };
        var o = $.extend(defaultOption,option);
        if(type == 'alert'){
            _.modalContent = '<div class="alert-msg">'+o.msg+'</div>'
        }else if(type == 'confirm'){
            _.detail = '';
            _.buttons='';
            _.bg = '<div class="confirm-bg"></div>';
            $.each(o.detail,function(i,item){
                _.detail += '<p>'+item+'</p>'
            });
            _.buttons += o.cancel?'<div class="confirm-msg-btns"><span>'+o.yes+'</span><span>'+o.cancel+'</span></div>':'<div class="confirm-msg-close"></div>';
            var $bts = o.cancel?'<div class="confirm-msg-content has-btn">'+_.detail+'</div>'+_.buttons+'</div>':'<div class="confirm-msg-content">'+_.detail+'</div>'+_.buttons+'</div>'
            _.modalContent = '<div class="confirm-msg"><div class="confirm-msg-title">'+o.title+'</div>'+$bts;
        }
        _.alert = function(){
            if($('.alert-msg').length == 0){
                _.$modalContent = $(_.modalContent).appendTo('body');
            }else{
                $('.alert-msg').remove();
                _.$modalContent = $(_.modalContent).appendTo('body');
            }
            // _.$modalContent[0].clientLeft;
        };
        _.confirm = function(){
            if($('.confirm-msg').length == 0){
                _.$modalContent = $(_.modalContent).appendTo('body');
            }else{
                $('.confirm-msg').remove();
                _.$modalContent = $(_.modalContent).appendTo('body');
            }
            _.$modalContent.css('marginTop',-_.$modalContent.height()/2/1.185);
            $('.confirm-bg').length == 0?$(_.bg).appendTo('body'):false;
        };
        _.open = function(){
            _.type=='alert'?_.alert():_.confirm();
            var clientLeft = _.$modalContent[0].clientLeft;
            _.$modalContent.css({'marginTop':-_.$modalContent.height()/2,'marginLeft':-_.$modalContent.width()/2/1.185});
            _.$modalContent.addClass('in');
            _.type == 'confirm'?$('.confirm-bg').addClass('confirm-bg-visible'):false;
            if(_.type == 'alert'){
                setTimeout(function(){
                    _.close();
                },2000)
            }else{
                _.$modalContent.find('.confirm-msg-close').click(function () {
                    o.yesFun();
                    _.close();
                });
                _.$modalContent.find('.confirm-msg-btns span').eq(0).click(function(){
                    o.yesFun();
                    _.close();
                });
                _.$modalContent.find('.confirm-msg-btns span').eq(1).click(function(){
                    o.cancelFun();
                    _.close();
                })
            }
        };
        _.close = function(){
            _.$modalContent.removeClass('in').addClass('out');
            _.type=='confirm'?$('.confirm-bg').removeClass('confirm-bg-visible'):false;
            var timer = _.type == 'alert'?150:400;
            setTimeout(function(){
                _.$modalContent.remove();
            },timer)
        }
    }
    $.alert = function(option){
        var alert = new Modal(option,'alert');
        alert.open();
    };
    $.confirm = function(option){
        var confirm = new Modal(option,'confirm');
        confirm.open();
    }
})(Zepto);

//防误触click事件

+function($){
    $.aClick = function(option){
        var defaultOption = {
            clickNode:false,
            parentNode : 'body',
            clickFun : function($this){
                //$this为当前点击dom的zepto对象
            }
        };
        var o = $.extend(defaultOption,option);
        var startObj = {x: 0, y: 0};
        var endObj = {x: 0, y: 0};
        document.addEventListener('touchstart', function (event) {
            startObj.x = event.touches[0].pageX;
            startObj.y = event.touches[0].pageY;
            endObj.x = 0;
            endObj.y = 0;
        });
        document.addEventListener('touchmove', function (event) {
            endObj.x = event.touches[0].pageX - startObj.x;
            endObj.y = event.touches[0].pageY - startObj.y;
        });
        $(o.parentNode).on('tap',o.clickNode,function(e){
            var $this = $(this);
            e.preventDefault();
            if (Math.abs(endObj.x) < 2 && Math.abs(endObj.y) < 2) {
                o.clickFun($this);
            }
        });
    }
}(Zepto);
// preloader
;(function($) {
    function Preloader() {
        this.show = function(content) {
            var preloaderHtml = '<div class="preloader-overlay"></div>' +
                '<div class="preloader-modal">' +
                '<span class="preloader ' +
                (content ? '' : 'preloader-no-content') + '"></span>' +
                (content ? '<span class="preloader-content">' + content + '</span>' : '') +
                '</div>';
            if ($('.preloader-modal')[0]) return;
            var $preloader = $(preloaderHtml).appendTo('body');
            $preloader.find('.preloader').addClass('preloader-animation');
        };
        this.hide = function() {
            $('.preloader-overlay, .preloader-modal').remove();
        }
    }
    var preloader = new Preloader();
    $.preloader = {
        show : preloader.show,
        hide : preloader.hide
    }
})(Zepto);
(function ($) {
    function Actions(option) {
        var defaultOption = {
            title: '',
            pick: '',
            items: ['选项1', '选项2'],
            clickFun: function (value) {
            },
            cancelFun: function () {
            }
        }
        var $modal, _this = this;
        var opts = $.extend(defaultOption, option);
        var html = '<div class="actions-wrap"><div class="modal-overlay"></div><div class="actions-modal"><ul class="items">';
        if (opts.title) {
            html += '<li class="title">' + opts.title + '</li>';
        }
        for (var i = 0; i < opts.items.length; i++) {
            html += '<li>' + opts.items[i] + '</li>';
        }
        html += '</ul><div class="cancel-btn">取消</div></div></div>';
        $modal = $(html).appendTo(document.body);

        if (opts.pick && $(opts.pick).length) {
            $(opts.pick).on('click', function (e) {
                _this.open();
            });
        }
        $modal.on('click', '.cancel-btn', function (e) {
            _this.close($modal);
            opts.cancelFun();
        });
        $modal.on('click', '.items li:not(.title)', function (e) {
            _this.close($modal);
            opts.clickFun($(this).text());
        });
        _this.open = function () {
            $modal.find('.actions-modal').addClass('show');
            $modal.find('.modal-overlay').addClass('visible');
        }
        _this.close = function () {
            $modal.find('.actions-modal').removeClass('show');
            $modal.find('.modal-overlay').removeClass('visible');
        }
        return _this;
    }
    $.actions = function (option) {
        return new Actions(option);
    };
})(Zepto);
(function ($) {
    function Popup(option) {
        var defaultOption = {
            title: '这是标题',
            pick: '',
            type: 'ttype',
            content: '',
            format: true,
            cancelFun: function () {
            }
        }
        var $modal, _this = this, html,$wrap;
        var opts = $.extend(defaultOption, option);
        html = '<div class="popup-modal-wrap"><div class="popup-overlay"></div><div class="popup-modal ' + opts.type + '"><div class="modal-content"><div class="header">'
            + opts.title + '</div><div class="content">';
        function ctype(){
            var subhtml = '<ul>';
            subhtml += '<li><span class="label">姓名</span><span class="value">'+opts.content.name+'</span></li>';
            if(opts.content.lastName){
                subhtml += '<li><span class="label">英文姓</span><span class="value">'+opts.content.lastName+'</span></li>';
            }
            if(opts.content.firstName){
                subhtml += '<li><span class="label">英文名</span><span class="value">'+opts.content.firstName+'</span></li>';
            }
            subhtml += '<li><span class="label">手机号</span><span class="value">'+opts.content.mobile+'</span></li>'
                +'<li><span class="label">'+opts.content.idType+'</span><span class="value">'+opts.content.idNo+'</span></li></ul>';
            return subhtml;
        }
        if (opts.type == 'ctype' && opts.format) {
            html += ctype();
        }else{
            html += opts.content[0];
        }

        html += '</div><div class="close">取消</div></div></div></div>';
        $wrap = $(html).appendTo(document.body);
        $modal = $wrap.find('.popup-modal');


        if (opts.pick && $(opts.pick).length) {
            $(opts.pick).on('click', function (e) {
                _this.open();
            });
        }
        $modal.on('click', '.close', function (e) {
            _this.close($modal);
            opts.cancelFun();
        });
        _this.open = function () {
            $wrap.show();
            $wrap[0].clientLeft;
            $modal.addClass('show');
            if($modal.siblings('.popup-overlay').length){
                $modal.siblings('.popup-overlay').addClass('visible');
            }else{
                $('.popup-overlay').addClass('visible');
            }
        }
        _this.close = function () {
            $modal.removeClass('show');
            // $modal.siblings('.popup-overlay').removeClass('visible');
            $('.popup-overlay').removeClass('visible');
            setTimeout(function () {
                $('.popup-modal-wrap').hide();
            }, 400);
        }
        return _this;
    }
    $.popup = function (option) {
        return new Popup(option);
    };
})(Zepto);
