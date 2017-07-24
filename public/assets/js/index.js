var $item = $('.carousel .carousel-item');
var $ban = $('.banner');
var $wHeight = $(window).height();
$item.eq(0).addClass('active');
$item.height($wHeight - 100);
$item.addClass('full-screen');
$ban.addClass('full-screen');
$ban.height($wHeight - 100);
$('.carousel img').each(function () {
    var $src = $(this).attr('src');
    var $color = $(this).attr('data-color');
    $(this).parent().css({
        'background-image': 'url(' + $src + ')'
        , 'background-color': $color
    });
    $(this).remove();
});
$(window).on('resize', function () {
    $wHeight = $(window).height();
    $item.height($wHeight - 100);
});
$('.carousel').carousel({
    interval: 6000
    , pause: "false"
});
//Shop Allocation
//for testing purposes
/*
var Ser_comLoadDat = [{
        "Name": "Auto Marg"
        , "Dynamic_Url": "rkxVUpY5rZ"
        , "Images": "./assets/shop1.jpg,https://storage.googleapis.com/titanium-flash-171510.appspot.com/SHOPS/Auto Marg/shop_1/IMAGE_audi Q7.PNG,https://storage.googleapis.com/titanium-flash-171510.appspot.com/SHOPS/Auto Marg/shop_1/IMAGE_Xlogo.png"
}, {
        "Name": "Vasant Marg"
        , "Dynamic_Url": "rkxVUpY5rZ"
        , "Images": "./assets/shop1.jpg,https://storage.googleapis.com/titanium-flash-171510.appspot.com/SHOPS/Auto Marg/shop_1/IMAGE_audi Q7.PNG,https://storage.googleapis.com/titanium- flash-171510.appspot.com/SHOPS/Auto Marg/shop_1/IMAGE_Xlogo.png"
}, {
        "Name": "Marg Marg"
        , "Dynamic_Url": "rkxVUpY5rZ"
        , "Images": "./assets/shop1.jpg,https://storage.googleapis.com/titanium-flash-171510.appspot.com/SHOPS/Auto Marg/shop_1/IMAGE_audi Q7.PNG,https://storage.googleapis.com/titanium- flash-171510.appspot.com/SHOPS/Auto Marg/shop_1/IMAGE_Xlogo.png"
    }

];
*/

/*
var $featured = $('.featured');
$featured[0].innerHTML = '<h1>FEATURED SHOPS</h1>';
$featured[0].innerHTML += '<div class = "row">';
if (typeof Ser_comLoadDat != 'undefined') {
    executeComUserFunc();
}
//DYNAMIC SHOP ARRANGEMENT
function executeComUserFunc() {
    for (let i in Ser_comLoadDat) {
        var Name = Ser_comLoadDat[i].Name;
        var DynamicUrl = Ser_comLoadDat[i].Dynamic_Url;
        var Images = Ser_comLoadDat[i].Images;
        Images = Images.split(',');
        $featured[0].innerHTML += '<div class=" col-12 col-md-4">' + '<div class="card" style="width: 20rem;">' + '<div class="card-header">' + Name + '</div>' + '<img class="card-img-top" src=' + Images[0] + ' alt="Card image cap">' + '</div>' + '</div>';
    }
    $featured[0].innerHTML += '</div>';
}
*/
