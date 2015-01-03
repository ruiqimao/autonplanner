var components = [];

function switchTab() {
	$(".tab-panel").fadeOut({'duration':200,'queue':false});
	$("#"+$(".selected").data("panel")).fadeIn({'duration':200,'queue':false});
}

$(".tab").click(function() {
	if($(this).hasClass("selected")) return;
	$(".tab").removeClass("selected");
	$(this).addClass("selected");
	switchTab();
});

switchTab();
