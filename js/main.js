var options = {
	'motor':['port1','port2','port3','port4','port5','port6','port7','port8','port9','port10'],
	'digitalsensor':['Digital 1','Digital 2','Digital 3','Digital 4','Digital 5','Digital 6','Digital 7','Digital 8','Digital 9','Digital 10','Digital 11','Digital 12']};

var field = [
	[0,0,0,0,2,0],
	[0,0,0,0,0,2],
	[0,0,0,0,0,0],
	[0,0,0,0,0,0],
	[1,0,0,0,0,0],
	[0,1,0,0,0,0]
];

var components = [];
var selectedComponent = 0;

var keyframes = [{'type':'init',''}];
var selectedKeyframe = 0;

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

function rotate(element,degrees) {
	element.css({
		'-webkit-transform':'rotate('+degrees+'deg)',
		'-ms-transform':'rotate('+degrees+'deg)',
		'transform':'rotate('+degrees+'deg)'});
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
	components.push({'name':'Untitled Component '+i,
					'type':0,
					'drive-motors-left':[],
					'drive-motors-right':[],
					'drive-encoder-left':0,
					'drive-encoder-right':0,
					'lift-motors':[],
					'lift-encoder':0,
					'pneumatic-ports':[],
					'other-motors':[]});
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
	var paneIndex = $(".config-component-type.selected").index();
	if(paneIndex == 0) {
		var motorsLeft = [];
		var motorsRight = [];
		$("#config-component-drive-motor-left").children().first().children().each(function() {
			motorsLeft.push($(this).data("index"));
		});
		$("#config-component-drive-motor-right").children().first().children().each(function() {
			motorsRight.push($(this).data("index"));
		});
		components[selectedComponent]['drive-motors-left'] = motorsLeft;
		components[selectedComponent]['drive-motors-right'] = motorsRight;
		components[selectedComponent]['drive-encoder-left'] = $("#config-component-drive-encoder-left").val();
		components[selectedComponent]['drive-encoder-right'] = $("#config-component-drive-encoder-right").val();
	}
	if(paneIndex == 1) {
		var motors = [];
		$("#config-component-lift-motor").children().first().children().each(function() {
			    motors.push($(this).data("index"));
		});
		components[selectedComponent]['lift-motors'] = motors;
		components[selectedComponent]['lift-encoder'] = $("#config-component-lift-encoder").val();
	}
	if(paneIndex == 2) {
		var ports = [];
		$("#config-component-pneumatic-port").children().first().children().each(function() {
			ports.push($(this).data("index"));
		});
		components[selectedComponent]['pneumatic-ports'] = ports;
	}
    if(paneIndex == 3) {
        var motors = [];
        $("#config-component-other-motor").children().first().children().each(function() {
            motors.push($(this).data("index"));
        });
        components[selectedComponent]['other-motors'] = motors;
    }
	$(".config-component.selected").text(newName);
	showMessage("Saved!");
});

$(".export-configuration").click(function() {
	var exportString = JSON.stringify(components);
	var pom = document.createElement('a');
	pom.setAttribute('target','_blank');
	pom.setAttribute('href','data:text/plain;charset=utf-8,'+encodeURIComponent(exportString));
	pom.setAttribute('download','configuration.vcfg');
	pom.click();
});

$(".import-configuration").click(function() {
	var fileInput = $('<input type="file" name="files[]" />');
	fileInput.on('change',function(event) {
		var file = $(this).get(0).files[0];
		var reader = new FileReader();
		reader.readAsText(file,"UTF-8");
		reader.onload = function(evt) {
			var content = evt.target.result;
			try {
				components = JSON.parse(content);
				updateComponentList();
				showMessage("Configuration loaded!");
			}
			catch(err) {
				throwError("Couldn't read the configuration file");
			}
		};
	});
	fileInput.click();
});

$(".config-component-type").click(function() {
	$(".config-component-type").removeClass("selected");
	$(this).addClass("selected");
	displayConfigComponentPane();
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
		displayConfigComponentPane();
	}
}

function displayConfigComponentPane() {
	var component = components[selectedComponent];
	var paneIndex = $(".config-component-type.selected").index();
	$(".config-component-pane").hide();
	$(".config-component-pane."+paneIndex).show();
	if(paneIndex == 0) {
		$("#config-component-drive-motor-left").children().first().empty();
		$("#config-component-drive-motor-right").children().first().empty();
		for(var i = 0; i < component['drive-motors-left'].length; i ++) {
			addOptionToBox($("#config-component-drive-motor-left"),component['drive-motors-left'][i]);
		}
		for(var i = 0; i < component['drive-motors-right'].length; i ++) {
			addOptionToBox($("#config-component-drive-motor-right"),component['drive-motors-right'][i]);
		}
		$("#config-component-drive-encoder-left").val(component['drive-encoder-left']);
		$("#config-component-drive-encoder-right").val(component['drive-encoder-right']);
	}
	if(paneIndex == 1) {
		$("#config-component-lift-motor").children().first().empty();
		for(var i = 0; i < component['lift-motors'].length; i ++) {
			addOptionToBox($("#config-component-lift-motor"),component['lift-motors'][i]);
		}
		$("#config-component-lift-encoder").val(component['lift-encoder']);
	}
	if(paneIndex == 2) {
	    $("#config-component-pneumatic-port").children().first().empty();
	    for(var i = 0; i < component['pneumatic-ports'].length; i ++) {
	        addOptionToBox($("#config-component-pneumatic-port"),component['pneumatic-ports'][i]);
	    }
	}
    if(paneIndex == 3) {
        $("#config-component-other-motor").children().first().empty();
        for(var i = 0; i < component['other-motors'].length; i ++) {
            addOptionToBox($("#config-component-other-motor"),component['other-motors'][i]);
        }
    }
}

function generateField() {
	$(".keyframes-field-tiles").empty();
	var robot = $('<div class="keyframes-field-robot"><i class="glyphicon glyphicon-arrow-right"></i></div>');
	$(".keyframes-field-tiles").append(robot);
	for(var i = 0; i < 6; i ++) {
		for(var j = 0; j < 6; j ++) {
			var element = field[j][i];
			var tile = $('<div class="keyframes-field-tile"></div>');
			switch(element) {
				case 0: {
					var tileColor = (i%2 == j%2)?'#DDDDDD':'#D4D4D4';
					tile.css({'background':tileColor});
					break;
				}
				case 1: {
					tile.css({'background':'#CC6666'});
					break;
				}
				case 2: {
					tile.css({'background':'#6666CC'});
					break;
				}
			}
			tile.css({'top':j*16.7+'%','left':i*16.7+'%'});
			$(".keyframes-field-tiles").append(tile);
		}
	}
}

function addOptionToBox(optionsGroup,index) {
	var optionsBox = optionsGroup.children().first();
	var optionType = optionsGroup.data("type");
	var newOption =  $('<span class="option" data-type="'+optionType+'" data-index="'+index+'"><span>'+options[optionType][index]+'</span></span>');
	var newOptionClose = $('<img class="option-close" src="images/icons/cancel.png" />');
	newOptionClose.click(function() {
		$(this).parent().remove();
	});
	newOption.click(function() {
		var subOptions = options[$(this).data("type")];
		var index = $(this).data("index");
		index ++;
		if(index >= subOptions.length) index = 0;
		$(this).data("index",index);
		$(this).children().first().text(subOptions[index]);
	});
	newOption.append(newOptionClose);
	optionsBox.append(newOption);
}

$(".options-button").click(function() {
	addOptionToBox($(this).parent(),0);
});

$(window).bind('keydown.ctrl_s keydown.meta_s', function(event) {
	if((event.ctrlKey || event.metaKey) && event.keyCode == 83) {
		if($("#config").is(":visible")) {
			if(selectedComponent < components.length) $(".save-component").click();
			event.preventDefault();
		}
	}
});

function resizeField() {
    var ratio = $(".keyframes-field-wrapper").width()/$(".keyframes-field-wrapper").height();
    if(ratio > 1) {
        $(".keyframes-field").height($(".keyframes-field-wrapper").height());
        $(".keyframes-field").width($(".keyframes-field").height());
    }else
    {   
        $(".keyframes-field").width($(".keyframes-field-wrapper").width());
        $(".keyframes-field").height($(".keyframes-field").width());
    }
}

$(window).bind('resize',function() {
	resizeField();
});

function switchTab() {
	$(".tab-panel").fadeOut({'duration':200,'queue':false});
	$("#"+$(".selected").data("panel")).fadeIn({'duration':200,'queue':false});
	resizeField();
}

$(".tab").click(function() {
	if($(this).hasClass("selected")) return;
	$(".tab").removeClass("selected");
	$(this).addClass("selected");
	switchTab();
});

switchTab();
updateComponentList();
generateField();
