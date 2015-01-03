var components = [];
var selectedComponent = 0;

function throwError(error) {
	$(".toast").addClass("error");
	$(".toast").text(error);
	if(!$(".toast").is(":animated") && !$(".toast").is(":visible")) $(".toast").fadeIn(500).delay(2000).fadeOut(500);
}

function showMessage(message) {
	$(".toast").removeClass("error");
	$(".toast").text(message);
	if(!$(".toast").is(":animated") && !$(".toast").is(":visible")) $(".toast").fadeIn(500).delay(2000).fadeOut(500);
}

function getComponent(name) {
	for(var i = 0; i < components.length; i ++) {
		var component = components[i];
		if(component['name'] == name) return [i,component];
	}
	return false;
}

function updateComponentList() {
	$(".config-components").html("");
	for(var i = 0; i < components.length; i ++) {
		var component = components[i];
		var componentDisplay = $('<div class="config-component">'+component['name']+'</div>');
		if(i == selectedComponent) componentDisplay.addClass("selected");
		componentDisplay.click(function() {
			var componentIndex = $(this).index();
			var component = components[componentIndex];
			selectedComponent = componentIndex;
			$(".config-component.selected").removeClass("selected");
			$(this).addClass("selected");
			displayComponent();
		});
		$(".config-components").append(componentDisplay);
	}
	if(components.length == 0) $(".delete-component").attr("disabled",true); else $(".delete-component").removeAttr("disabled");
	if(selectedComponent >= components.length) $(".save-component").attr("disabled",true); else $(".save-component").removeAttr("disabled");
	displayComponent();
}

$(".new-component").click(function() {
	var i = 1;
	while(getComponent("Untitled Component "+i)) i ++;
	components.push({'name':'Untitled Component '+i,'type':0});
	selectedComponent = components.length-1;
	updateComponentList();
});

$(".delete-component").click(function() {
	if(selectedComponent >= components.length) return;
	components.splice(selectedComponent,1);
	if(selectedComponent >= components.length) selectedComponent = components.length-1;
	if(selectedComponent < 0) selectedComponent = 0;
	updateComponentList();
});

$(".save-component").click(function() {
	var newName = $(".config-component-name").val();
	var existingComponent = getComponent(newName);
	if(existingComponent) if(existingComponent[0] != selectedComponent) {
		throwError("A component with that name already exists!");
		return;
	}
	components[selectedComponent]['name'] = newName;
	components[selectedComponent]['type'] = $(".config-component-type.selected").index();
	$(".config-component.selected").text(newName);
	showMessage("Saved!");
});

$(".config-component-type").click(function() {
	$(".config-component-type").removeClass("selected");
	$(this).addClass("selected");
});

function displayComponent() {
	if(selectedComponent >= components.length) {
		$(".config-component-settings").hide();
		$(".config-component-blank").show();
	}else
	{
		$(".config-component-blank").hide();
		$(".config-component-settings").show();
		var component = components[selectedComponent];
		$(".config-component-name").val(component['name']);
		$(".config-component-type").removeClass("selected");
		$(".config-component-type:nth-child("+(component['type']+1)+")").addClass("selected");
	}
}

$(window).bind('keydown.ctrl_s keydown.meta_s', function(event) {
	if(event.keyCode == 83) {
		if($("#config").is(":visible")) {
			if(selectedComponent < components.length) $(".save-component").click();
			event.preventDefault();
		}
	}
});

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
updateComponentList();
