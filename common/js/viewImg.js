/**
 * Created by ashbringer on 16/8/22.
 */
+function ($) {
    function render(imgArray) {
        var img = '';
        $.each(imgArray,function (i,v) {
            img += '<div class="img-viewer-swiper-item"><img src="'+v+'" alt=""></div>'
        });
        var imgView = '<div class="img-viewer-overlay overlay-visible"></div><div class="img-viewer" style="display: block"><div class="img-viewer-header"><a href="#"></a><div class="img-viewer-header-text">1 / 4</div></div><div class="img-viewer-content"><div class="img-viewer-swiper-container">'+img+'</div></div></div>';
        var $img = $(imgView).appendTo('body');
    }
    $.viewImg = function (imgArray) {
        render(imgArray);
    }
}(Zepto);