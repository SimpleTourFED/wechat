/**
 * Created by ashbringer on 16/8/22.
 */
+function ($) {
    function ImgView(){
        var _ = this;
        _.index = 0;
        _.length = 1;
        _.width = $(window).width();
        _.render = function (imgArray,index) {
            var img = '';
            _.index = index;
            _.length = imgArray.length;
            $.each(imgArray,function (i,v) {
                img += '<div class="img-viewer-swiper-item"><img data-src="'+ v +'" src="/master-Q3/images/defalut-img@588250.png" alt=""></div>'
            });
            var imgView = '<div class="img-viewer" style="display: block"><div class="img-viewer-header"><a href="#"></a><div class="img-viewer-header-text">'+(parseInt(_.index)+1)+' / '+_.length+'</div></div><div class="img-viewer-content"><div class="img-viewer-swiper-container" style="transform: translate3d('+(-_.index*_.width)+'px,0,0)">'+img+'</div></div></div>';
            _.$img = $(imgView).appendTo('body');
            _.lazyLoad(_.index);
            _.$img[0].clientLeft;
            _.$img.addClass('visible');
            _.move();
            _.close();
        };
        _.animation = function (direction) {
            if(direction === 'left' && _.index+1 != _.length){
                _.index += 1;
                _.$img.find('.img-viewer-swiper-container').css('transform','translate3d('+(-_.index*_.width)+'px,0,0)');
                _.lazyLoad(_.index);
            }else if(direction === 'left' && _.index+1 == _.length){
                _.$img.find('.img-viewer-swiper-container').css('transform','translate3d('+(-_.index*_.width)+'px,0,0)');
            }
            if(direction === 'right' && _.index != 0){
                _.index -= 1;
                _.$img.find('.img-viewer-swiper-container').css('transform','translate3d('+(-_.index*_.width)+'px,0,0)');
                _.lazyLoad(_.index);
            }else if(direction === 'right' && _.index == 0){
                _.$img.find('.img-viewer-swiper-container').css('transform','translate3d('+(-_.index*_.width)+'px,0,0)');
            }
            _.$img.find('.img-viewer-header-text').html(_.index+1+' / '+_.length);
        };
        _.close = function () {
          _.$img.find('.img-viewer-header a').click(function (e) {
              e.preventDefault();
              _.$img.removeClass('visible');
              setTimeout(function () {
                  _.$img.remove();
              },401)
          })
        };
        _.move = function () {
            var $this = _.$img.find('.img-viewer-swiper-container');
            var startX = 0;
            var endX = 0;
            $this[0].addEventListener('touchstart',function(e){
                $this.css('transition-duration','0ms');
                endX = startX = e.touches[0].pageX;

            });
            $this[0].addEventListener('touchmove',function(e){
                e.preventDefault();
                e.stopPropagation();
                endX = e.touches[0].pageX;
                $this.css('transform','translate3d('+(-_.width*_.index+endX-startX)+'px,0,0)')
            });
            $this[0].addEventListener('touchend',function(e){
                $this.css('transition-duration','400ms');
                if(Math.abs((endX-startX)/_.width) > .125){
                    var direction = endX - startX > 0 ?'right':'left';
                    _.animation(direction);
                }else{
                    $this.css('transform','translate3d('+(-_.width*_.index)+'px,0,0)')
                }
            })
        };
        _.lazyLoad = function (index) {
            var $this = $('.img-viewer-swiper-container img').eq(index);
            if($this.attr('data-src')!==$this.attr('src')){
                var img = new Image();
                img.src = $this.attr('data-src');
                img.onload = function () {
                    $this.attr('src',$this.attr('data-src'));
                }
            }
        }
    }
    $.viewImg = function (imgArray, index) {
        index  = Object.prototype.toString.call(index) === "[object Undefined]"?0:index;
        var imgView = new ImgView();
        imgView.render(imgArray,index);
    }
}(Zepto);