var $item = $('.carousel .carousel-item'); 
var $ban = $('.banner');
var $wHeight = $(window).height();
$item.eq(0).addClass('active');
$item.height($wHeight - 50); 
$item.addClass('full-screen');
$ban.addClass('full-screen');
$ban.height($wHeight - 50);

$('.carousel img').each(function() {
  var $src = $(this).attr('src');
  var $color = $(this).attr('data-color');
  $(this).parent().css({
    'background-image' : 'url(' + $src + ')',
    'background-color' : $color
  });
  $(this).remove();
});

$(window).on('resize', function (){
  $wHeight = $(window).height();
  $item.height($wHeight-50);
});

$('.carousel').carousel({
  interval: 6000,
  pause: "false"
});