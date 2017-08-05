var $item = $('.carousel .carousel-inner');
var $wHeight = $(window).height();
$item.height($wHeight - 120);
$item.addClass('full-screen');

$(window).on('resize', function () {
    $wHeight = $(window).height();
    $item.height($wHeight - 120);
});


$('.carousel').carousel({
    interval: 3000
    , pause: "false"
});












//Shop Allocation

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
