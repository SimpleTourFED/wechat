;(function() {
    function Lazyload(option){
        var l = this;

        var defaultOption = {
            visibleZone: ''
        };
        var o = $.extend(defaultOption,option);
        var resizeEvt = 'orientationchange' in window ? 'orientationchange' : 'resize'; // 确定窗口变化或是移动端横竖屏
        l.getImages = function() {
            return {
                img: document.getElementsByTagName('img'),
                backgroundImg: document.getElementsByClassName('lazyLoad')
            }
        };
        // 获取浏览器可视区域
        l.getViewVisibleZone = function() {
            if(o.visibleZone) {
                return {
                    top : $(o.visibleZone).scrollTop(),
                    left : $(o.visibleZone).scrollLeft(),
                    width : document.documentElement.clientWidth,
                    height : document.documentElement.clientHeight
                };
            } else {
                return {
                    top : document.documentElement.scrollTop||document.body.scrollTop,
                    left : document.documentElement.scrollLeft||document.body.scrollLeft,
                    width : document.documentElement.clientWidth,
                    height : document.documentElement.clientHeight
                };
            }
        };
        // 获取待加载资源的区域
        l.getResourceZone = function(obj){
            return {
                left : obj.offsetLeft,
                top : obj.offsetTop,
                width : obj.offsetWidth,
                height : obj.offsetHeight
            };
        }
        // 判断待加载资源是否出现在可视区域
        l.isContains = function (visibleZone,resourceZone){

            var visibleW = visibleZone.left + visibleZone.width/2,
                resourceW = resourceZone.left + resourceZone.width/2,
                visibleH = visibleZone.top + visibleZone.height/2,
                resourceH = resourceZone.top + resourceZone.height/2;

            var wid = (visibleZone.width + resourceZone.width)/2,
                hei = (visibleZone.height + resourceZone.height)/2;

            return Math.abs(visibleW - resourceW) < wid && Math.abs(visibleH - resourceH) < hei;
        }
        var imagesObj = l.getImages();
        l.winScroll = function (e){
            var visibleZone = l.getViewVisibleZone(),
                resourceZone;
            var image = new Image();
            for(var i = 0, bgImg; bgImg = imagesObj.backgroundImg[i++];) {

                resourceZone = l.getResourceZone(bgImg);
                if( l.isContains(visibleZone,resourceZone) ) {
                    // image.onload=function(bgImg){
                    // };
                    // image.onerror=function(){
                    //     alert('error')
                    // };
                    image.src = bgImg.getAttribute("data-src");
                    bgImg.style.background = bgImg.style.background.replace(/\([^\)]*\)/g,'('+bgImg.getAttribute("data-src")+')');
                    delete imagesObj.backgroundImg[i];
                }
            }

            for(var j = 0, img; img = imagesObj.img[j++];) {

                resourceZone = l.getResourceZone(img);
                if( l.isContains(visibleZone,resourceZone) ) {
                    var imgUrl = img.getAttribute("data-src");
                    // var defalutImg = img.getAttribute("src");
                    // var imgCache = img;
                    // image.onload=function(){};
                    // image.onerror=function(){
                    //     $(imgCache).attr('src',defalutImg);
                    // };
                    image.src = imgUrl;
                    img.src = imgUrl;
                    delete imagesObj.img[j];
                }
            }
        };
        l.winScroll();
        var count = 0, timer = null;
        var oldTop = newTop = $(o.visibleZone).scrollTop(); //为了方便起见，使用jquery或者zepto框架
        function log(){
            if(timer) clearTimeout(timer);
            newTop = $(o.visibleZone).scrollTop();
            if(newTop === oldTop) {
                clearTimeout(timer);
                l.winScroll();
            } else{
                oldTop = newTop;
                timer = setTimeout(log,100);
            }
        }
        document.addEventListener('touchend', log, false); // 监听滚动事件
        window.addEventListener(resizeEvt, l.winScroll, false); // 监听窗口变化
    }

    $.lazyload = function(option){
        var lazyload = new Lazyload(option);
    };
})(Zepto);
