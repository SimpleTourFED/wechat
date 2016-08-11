(function($){
    function Slider(option){
        var s = this;
        
        var defaultOption = {
            className: '.slider-container',
            pagination: false,
            autoPlay: true,
            clickEvent: function(){}
        };
        var o = $.extend(defaultOption,option);

        var $slideItem = $(o.className + ' .slider-wrapper .slider-item');

        s.paginationHtml = '';
        s.sliderPositions = [];
        s.$container = $(o.className);
        s.$wrapper = $(o.className + ' .slider-wrapper');
        s.width = s.$container.width();
        s.sliderIndex = 1; // 记录slider 当前的index

        for(var i = 0, len = $slideItem.length; i < len; i++) {
            s.paginationHtml += i == 0 ? '<span class="slider-pagination-item active"></span>': '<span class="slider-pagination-item"></span>';
            $slideItem.eq(i).attr('data-slider-index',i);
            $slideItem.eq(i).css('width',s.width);
        }
        /* =============================
         ***** slider 初始化一些东西  *****
         =============================== */
        s.init = function() {
            s.toHtml();
            document.querySelector(o.className).addEventListener('touchstart', s.onTouchStart, false);
            document.querySelector(o.className).addEventListener('touchmove', s.onTouchmove, false);
            document.querySelector(o.className).addEventListener('touchend', s.onTouchEnd, false);
            
            // 绑定点击事件
            $(document).on('tap', '.slider-item img', function (e) {
                e.preventDefault();
                if (Math.abs(endObj.x) < 2 && Math.abs(endObj.y) < 2) {
                    o.clickEvent($(this));
                }
            });
            s.setWrapperTranstion(0);
            s.setWrapperTranslate(-s.width);

            if(o.autoPlay) s.autoPlay();
        };
        /* =============================
         ***** autoPlay  *****
         =============================== */
        s.autoPlay = function() {
            var autoPlayIndex = s.sliderIndex;
            var autoPlayTimes = typeof o.autoPlay === 'number' ? o.autoPlay : 4000;

            s.sliderTime = setInterval(function() {
                s.slideItem.removeClass('active');
                if(autoPlayIndex >= s.sliderPositions.length - 1) {
                    s.slideTo(s.sliderPositions.length - 1);
                    setTimeout(function() {
                        s.setWrapperTranstion(0);
                        s.setWrapperTranslate(s.sliderPositions[1]);
                    },300);
                    autoPlayIndex = 2;
                    s.slideItem.eq(1).addClass('active');
                } else{
                    s.slideTo(autoPlayIndex);
                    s.slideItem.eq(autoPlayIndex).addClass('active');
                    autoPlayIndex++;
                }
            }, autoPlayTimes);
        };
        /* =============================
         ***** 转化html  *****
         =============================== */
        s.toHtml = function() {
            // 是否需要pagination
            o.pagination && $('.slider-pagination').append(s.paginationHtml);
            $('.slider-wrapper').prepend($slideItem.eq(-1).clone()).append($slideItem.eq(0).clone());

            // 因为新增了clone出来的两个item,所以这里需要再取一次
            s.slideItem = $(o.className + ' .slider-wrapper .slider-item');
            for(var i = 0, len = s.slideItem.length; i < len; i++) {
                s.sliderPositions.push(-s.width * i);
            }
            // 给两个clone出来的item增加辨识的class
            s.slideItem.eq(0).addClass('slider-duplicate');
            s.slideItem.eq(1).addClass('active');
            s.slideItem.eq(-1).addClass('slider-duplicate');
        };
        /* =============================
         ***设置wrapper的transform效果***
         =============================== */
        s.setWrapperTranslate = function(translate) {
            s.$wrapper.css({
                "transform": "translate3d(" + translate + "px, 0px, 0px);"
            })
        };
        /* =============================
         ***设置wrapper的transform的时间延迟***
         =============================== */
        s.setWrapperTranstion = function(duration) {
            s.$wrapper.css({
                "transition-duration": duration+"ms;"
            })
        };
        /* =============================
         ***设置Pagination效果***
         =============================== */
        s.setPaginationActive = function(index) {
            var $paginationItem = $('.slider-pagination .slider-pagination-item');

            $paginationItem.removeClass('active');
            if(index == 0) {
                $paginationItem.eq($paginationItem.length-1).addClass('active');
            } else if(index == s.sliderPositions.length - 1) {
                $paginationItem.eq(0).addClass('active');
            } else {
                $paginationItem.eq(index-1).addClass('active');
            }
        };
        /* =============================
         ***获取wrapper的Translate***
         =============================== */
        s.getWrapperTranslate = function(el) {
            var curStyle = window.getComputedStyle(el, null);
            var transformMatrix, matrix;
            if (window.WebKitCSSMatrix) {
                var curTransform = curStyle.transform || curStyle.webkitTransform;
                if (curTransform.split(',').length > 6) {
                    curTransform = curTransform.split(', ').map(function(a){
                        return a.replace(',','.');
                    }).join(', ');
                }
                // Some old versions of Webkit choke when 'none' is passed; pass
                // empty string instead in this case
                transformMatrix = new window.WebKitCSSMatrix(curTransform === 'none' ? '' : curTransform);
            }
            else {
                transformMatrix = curStyle.MozTransform || curStyle.OTransform || curStyle.MsTransform || curStyle.msTransform  || curStyle.transform || curStyle.getPropertyValue('transform').replace('translate(', 'matrix(1, 0, 0, 1,');
                matrix = transformMatrix.toString().split(',');
            }
            if (window.WebKitCSSMatrix) {
                curTransform = transformMatrix.m41;
            }else {
                curTransform = parseFloat(matrix[4]);
            }
            return curTransform;
        };
        /* =============================
         ***slide的变化函数***
         =============================== */
        s.slideTo = function(slideIndex) {
            if (typeof slideIndex === 'undefined') slideIndex = 0;
            if(slideIndex < 0) slideIndex = 0;
            var translate = s.sliderPositions[slideIndex];

            s.setPaginationActive(slideIndex);
            s.setWrapperTranstion(300);
            s.setWrapperTranslate(translate);
        };
        
        var isMoved,
            isTouchEvent,
            currentTranslate,
            newTranslate,
            startTranslate;
        // startObj endObj两个参数是防止滑动过程中不小心出发点击事件
        var startObj = {x: 0, y: 0};
        var endObj = {x: 0, y: 0};
        s.touches = {
            startX: 0,
            startY: 0,
            currentX: 0,
            currentY: 0,
            diff: 0
        };
        s.onTouchStart = function(e) {
            if (e.originalEvent) e = e.originalEvent;
            isTouchEvent = e.type === 'touchstart';
            if (!isTouchEvent && 'which' in e && e.which === 3) return;
            isMoved = false;
            startObj.x = event.touches[0].pageX;
            startObj.y = event.touches[0].pageY;
            endObj.x = 0;
            endObj.y = 0;

            var startX = s.touches.currentX = e.type === 'touchstart' ? e.targetTouches[0].pageX : e.pageX;
            var startY = s.touches.currentY = e.type === 'touchstart' ? e.targetTouches[0].pageY : e.pageY;

            // 这里是将复制出来的尽头元素移到原本的元素位置,更平滑的实现左右滑动
            if(s.sliderIndex == s.sliderPositions.length - 1) {
                s.setWrapperTranstion(0);
                s.setWrapperTranslate(s.sliderPositions[1]);
                s.sliderIndex = 1;
            }
            if(s.sliderIndex == 0) {
                s.setWrapperTranstion(0);
                s.setWrapperTranslate(s.sliderPositions[s.sliderPositions.length - 2]);
                s.sliderIndex = s.sliderPositions.length - 2;
            }
            // 暂停自动播放
            if (s.sliderTime) clearTimeout(s.sliderTime);
        };
        s.onTouchmove = function(e) {
            e.preventDefault();
            if (e.originalEvent) e = e.originalEvent;
            if (isTouchEvent && e.type === 'mousemove') return;

            s.touches.startX = e.type === 'touchmove' ? e.targetTouches[0].pageX : e.pageX;
            s.touches.startY = e.type === 'touchmove' ? e.targetTouches[0].pageY : e.pageY;

            var diff = s.touches.diff = s.touches.currentX - s.touches.startX;

            // 这里使用isMoved来防止移动过程中s.getWrapperTranslate()函数一直执行消耗性能
            if(!isMoved) {
                startTranslate = s.getWrapperTranslate(s.$wrapper[0]);
            }
            isMoved = true;
            endObj.x = event.touches[0].pageX - startObj.x;
            endObj.y = event.touches[0].pageY - startObj.y;

            currentTranslate = -diff + startTranslate;
            s.setWrapperTranstion(0);
            s.setWrapperTranslate(currentTranslate); // 更平滑的拖拽效果
        };
        s.onTouchEnd = function(e) {
            s.slideItem.removeClass('active');
            console.log(s.sliderIndex)
            if(s.touches.diff > 20) {

                if (s.sliderIndex == s.sliderPositions.length - 1) { 
                    s.sliderIndex = 2;  // 当index到最后一个时,也就是下一次跳转将到2
                } else {
                    s.sliderIndex ++;
                }
                s.slideTo(s.sliderIndex);
                s.slideItem.eq(s.sliderIndex).addClass('active');
            } else if(s.touches.diff < -20) {

                if(s.sliderIndex == 0) {
                    s.sliderIndex = s.sliderPositions.length - 3; //从右向左时,当index到第一个时,也就是下一次跳转将到倒数第三张图片
                } else {
                    s.sliderIndex --;
                }
                s.slideTo(s.sliderIndex);
                s.slideItem.eq(s.sliderIndex).addClass('active');
            }
            isMoved = false;
            // 开始自动播放
            if(o.autoPlay) s.autoPlay();
        };
    }
    
    $.slider = function(option){
        var slider = new Slider(option);
        slider.init();
    };
})(Zepto);