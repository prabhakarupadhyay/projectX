//Accordian
var action="click";
var speed="500";

$(document).ready(function(){
	$('li.category').on(action,function(){
		$(this).next()
			.slideToggle(speed)
				.siblings('li.sub-category')
					.slideUp();
		var img = $(this).children('img');
		//Remove the 'rotate' class except the active 
		$('img').not(img).removeClass('rotate');
		//Toggle rotate class
		img.toggleClass('rotate');
	});
});