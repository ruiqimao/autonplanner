hljs.configure({useBR:true, tabReplace:'&nbsp;&nbsp;&nbsp;&nbsp;'});

var options = {
	'motor':['port1','port2','port3','port4','port5','port6','port7','port8','port9','port10'],
	'digitalsensor':['Digital 1','Digital 2','Digital 3','Digital 4','Digital 5','Digital 6','Digital 7','Digital 8','Digital 9','Digital 10','Digital 11','Digital 12']};

var field = [
	[0,3,0,0,4,0],
	[0,0,0,0,0,0],
	[0,0,0,0,0,0],
	[0,0,0,0,0,0],
	[0,0,0,0,0,0],
	[0,1,0,0,2,0]
];

var components = [];
var selectedComponent = 0;

var keyframes = [{'type':'init','properties':{'start':1}}];
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

function getProperty(properties,key,defaultvalue) {
	if(properties[key] == undefined) return defaultvalue;
	return properties[key];
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
					'type':3,
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

$(".config-component-name,#config-component-drive-encoder-left,#config-component-drive-encoder-right,#config-component-lift-encoder").on('change',function() {
	saveComponent();
});

function saveComponent() {
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
}

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
	var driveExists = false;
	for(var i = 0; i < components.length; i ++) {
		if(components[i]['type'] == 0) driveExists = true;
	}
	if($(this).index() == 0 && driveExists) {
		throwError("You already have a drive component!");
		return;
	}
	$(".config-component-type").removeClass("selected");
	$(this).addClass("selected");
	displayConfigComponentPane();
	saveComponent();
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

function updateKeyframeList() {
    $(".keyframes-frames").html("");
    for(var i = 0; i < keyframes.length; i ++) {
        var frame = keyframes[i];
        var frameDisplay = $('<div class="keyframes-frame">Frame '+(i+1)+'</div>');
        if(i == selectedKeyframe) frameDisplay.addClass("selected");
        frameDisplay.click(function() {
            var frameIndex = $(this).index();
            var frame = keyframes[frameIndex];
            selectedKeyframe = frameIndex;
            $(".keyframes-frame.selected").removeClass("selected");
            $(this).addClass("selected");
			if(frameIndex == 0) $(".delete-keyframe").attr("disabled",true); else $(".delete-keyframe").removeAttr("disabled");
            displayKeyframe();
			moveRobot();
        });
        $(".keyframes-frames").append(frameDisplay);
    }
    if(keyframes.length <= 1) $(".delete-keyframe").attr("disabled",true); else $(".delete-keyframe").removeAttr("disabled");
    if(selectedKeyframe >= keyframes.length) $(".save-keyframe").attr("disabled",true); else $(".save-keyframe").removeAttr("disabled");
    displayKeyframe();
}

function displayKeyframe() {
	var keyframe = keyframes[selectedKeyframe];
	var type = keyframe['type'];
	$(".keyframes-properties-pane").hide();
	$("#"+type).show();
	if(type == 'init') {
		var properties = keyframe['properties'];
		var startingTile = getProperty(properties,'start',1);
		var rotation = getProperty(properties,'rotation',0.0);
		var xoffset = getProperty(properties,'xoffset',0.0);
		var yoffset = getProperty(properties,'yoffset',0.0);
		$("#keyframes-init-start").val(startingTile);
		$(".keyframes-init-rotation").val(rotation);
		$(".keyframes-init-xoffset").val(xoffset);
		$(".keyframes-init-yoffset").val(yoffset);
		$(".keyframes-init-lift").empty();
		$(".keyframes-init-pneumatics").empty();
		for(var i = 0; i < components.length; i ++) {
			var component = components[i];
			if(component['type'] == 1) {
				$(".keyframes-init-lift").append($('<h4>'+component['name']+'</h4>'));
				var input = $('<input type="text" data-name="'+component['name']+'" class="input-text" placeholder="Initial Setting" />');
				var value = getProperty(properties,'-'+component['name'],0);
				input.val(value);
				input.on('change',function() {
					var v = $(this).val();
					if(isNaN(v)) v = 0;
					$(this).val(v);
					keyframes[0]['properties']['-'+$(this).data("name")] = v;
				});
				$(".keyframes-init-lift").append(input);
			}
            if(component['type'] == 2) {
                $(".keyframes-init-pneumatics").append($('<h4>'+component['name']+'</h4>'));
                var input = $('<select data-name="'+component['name']+'"><option value="0">Off</option><option value="1">On</option></select>');
                var value = getProperty(properties,'-'+component['name'],0);
                input.val(value);
                input.on('change',function() { 
                    keyframes[0]['properties']['-'+$(this).data("name")] = $(this).val();
                });
                $(".keyframes-init-pneumatics").append(input);
            }
		}
	}
	if(type == 'pid') {
		var properties = keyframe['properties'];
		$("#keyframes-pid-type").val("pid");
		$("#keyframes-pid-target").empty();
		$("#keyframes-pid-action").val("drive");
		for(var i = 0; i < components.length; i ++) {
			var component = components[i];
			if(parseInt(component['type']) < 2) {
				$("#keyframes-pid-target").append($('<option value="'+component['name']+'">'+component['name']+'</option>'));
			}
		}
		var target = getProperty(properties,'target',undefined);
		if(getComponent(target)) {
			$("#keyframes-pid-target").val(target);
		}else
		{
			if(components.length > 0) $("#keyframes-pid-target").val(components[0]['name']);
		}
		var component = getComponent($("#keyframes-pid-target").val());
		if(component) {
			keyframe['properties']['target'] = component[1]['name'];
            if(parseInt(component[1]['type']) == 0) {
                $(".keyframes-pid-drive").show();
                var action = getProperty(properties,'action','drive');
                $("#keyframes-pid-action").val(action);
            }else
            {
                $(".keyframes-pid-drive").hide();
            }
		}else
		{
			$(".keyframes-pid-drive").hide();
		}
		var value = getProperty(properties,'value',0);
		$(".keyframes-pid-value").val(value);
	}
	if(type == 'time') {
		var properties = keyframe['properties'];
		$("#keyframes-time-type").val("time");
		$("#keyframes-time-target").empty();
		$("#keyframes-pid-pneumatics-value").val(0);
		$(".keyframes-pid-other-value").val(0);
		for(var i = 0; i < components.length; i ++) {
		    var component = components[i];
		    if(parseInt(component['type']) > 1) {
		        $("#keyframes-time-target").append($('<option value="'+component['name']+'">'+component['name']+'</option>'));
			}
		}
        var target = getProperty(properties,'target',undefined);
        if(getComponent(target)) {
            $("#keyframes-time-target").val(target);
        }else
        {
            if(components.length > 0) $("#keyframes-time-target").val(components[0]['name']);
        }
		var value = getProperty(properties,'value',0);
        var component = getComponent($("#keyframes-time-target").val());
        if(component) {
            keyframe['properties']['target'] = component[1]['name'];
            if(parseInt(component[1]['type']) == 2) {
                $(".keyframes-time-pneumatics").show();
				$(".keyframes-time-other").hide();
				$(".keyframes-time-value-header").show();
				$("#keyframes-time-pneumatics-value").val(value);
            }else
            {
                $(".keyframes-time-pneumatics").hide();
				$(".keyframes-time-other").show();
				$(".keyframes-time-value-header").show();
				$(".keyframes-time-other-value").val(value);
            }
        }else
        {
            $(".keyframes-time-pneumatics").hide();
			$(".keyframes-time-other").hide();
			$(".keyframes-time-value-header").hide();
        }
		var time = getProperty(properties,'time',0);
		$(".keyframes-time-time").val(time);
	}
}

$(".new-keyframe").click(function() {
	keyframes.push({'type':'pid','properties':{}});
    selectedKeyframe = keyframes.length-1;
    updateKeyframeList();
	moveRobot();
});

$(".delete-keyframe").click(function() {
    if(selectedKeyframe >= keyframes.length || selectedKeyframe == 0) return;
    keyframes.splice(selectedKeyframe,1);
    if(selectedKeyframe >= keyframes.length) selectedKeyframe = keyframes.length-1;
    if(selectedKeyframe < 0) selectedKeyframe = 0;
    updateKeyframeList();
	moveRobot();
});

$("#keyframes-time-target").on('change',function() {
	keyframes[selectedKeyframe]['properties']['target'] = $(this).val();
	displayKeyframe();
	moveRobot();
});

$("#keyframes-time-pneumatics-value").on('change',function() {
	keyframes[selectedKeyframe]['properties']['value'] = $(this).val();
	moveRobot();
});

$(".keyframes-time-other-value").on('change',function() {
	var value = $(this).val();
	if(isNaN(value)) value = 0;
	$(this).val(value);
	keyframes[selectedKeyframe]['properties']['value'] = value;
});

$(".keyframes-time-time").on('change',function() {
	var value = $(this).val();
	if(isNaN(value)) value = 0;
	$(this).val(value);
	keyframes[selectedKeyframe]['properties']['time'] = value;
});

$("#keyframes-pid-type").on('change',function() {
	keyframes[selectedKeyframe]['type'] = $(this).val();
	displayKeyframe();
	moveRobot();
});

$("#keyframes-pid-target").on('change',function() {
	keyframes[selectedKeyframe]['properties']['target'] = $(this).val();
	displayKeyframe();
	moveRobot();
});

$("#keyframes-pid-action").on('change',function() {
	keyframes[selectedKeyframe]['properties']['action'] = $(this).val();
	moveRobot();
});

$(".keyframes-pid-value").on('change',function() {
	var value = $(this).val();
	if(isNaN(value)) value = 0;
	$(this).val(value);
	keyframes[selectedKeyframe]['properties']['value'] = value;
	moveRobot();
});

$("#keyframes-time-type").on('change',function() {
	keyframes[selectedKeyframe]['type'] = $(this).val();
	displayKeyframe();
	moveRobot();
});

$("#keyframes-init-start").on('change',function() {
	keyframes[0]['properties']['start'] = parseInt($(this).val());
	moveRobot();
});

$(".keyframes-init-rotation").on('change',function() {
	var value = $(this).val();
	if(isNaN(value)) value = 0;
	if(parseFloat(value) < 0 || parseFloat(value) >= 360) value = 0;
	$(this).val(value);
	keyframes[0]['properties']['rotation'] = parseFloat($(this).val());
	moveRobot();
});

$(".keyframes-init-xoffset").on('change',function() {
	var value = $(this).val();
	if(isNaN(value)) value = 0;
	$(this).val(value);
	keyframes[0]['properties']['xoffset'] = parseFloat($(this).val());
	moveRobot();
});

$(".keyframes-init-yoffset").on('change',function() {
    var value = $(this).val();
    if(isNaN(value)) value = 0;
    $(this).val(value);
    keyframes[0]['properties']['yoffset'] = parseFloat($(this).val());
    moveRobot();
});

function moveRobot() {
	$(".keyframes-field-marker").remove();
	var robot = $(".keyframes-field-robot");
    var rx = 0.0;
    var ry = 0.0;
    var rr = 0.0;
    var initProperties = keyframes[0]['properties'];
    var startingTile = getProperty(initProperties,'start',1);
    switch(startingTile) {
        case 1: {
            rx = 36;
            ry = 132;
            break;
        }
        case 2: {
            rx = 108;
            ry = 132;
			break;
        }
		case 3: {
			rx = 36;
			ry = 12;
			break;
		}
		case 4: {
			rx = 108;
			ry = 12;
			break;
		}
    }
	rr = getProperty(initProperties,'rotation',0.0);
	rx += getProperty(initProperties,'xoffset',0.0);
	ry += getProperty(initProperties,'yoffset',0.0);
	for(var i = 0; i <= selectedKeyframe; i ++) {
		var keyframe = keyframes[i];
		if(keyframe['type'] == 'pid') {
			var componentName = getProperty(keyframe['properties'],'target',undefined);
			var component = getComponent(componentName);
			if(component) {
				if(parseInt(component[1]['type']) == 0) {
					var action = getProperty(keyframe['properties'],'action','drive');
					var value = getProperty(keyframe['properties'],'value',0);
					if(action == 'drive') {
						var angle = (rr-90)*Math.PI/180;
						var direction = value>0?1:-1;
						for(var j = 0; j < Math.abs(value); j += 4) {
							var mx = rx + Math.cos(angle)*j*direction;
							var my = ry + Math.sin(angle)*j*direction;
							var marker = $('<div class="keyframes-field-marker"></div>');
							marker.css({'left':(mx/144*100-1)+'%','top':(my/144*100-1)+'%'});
							$(".keyframes-field-tiles").append(marker);
						}
						rx += Math.cos(angle)*value;
						ry += Math.sin(angle)*value;
					}else
					{
						rr += parseFloat(value);
					}
				}
			}
		}
	}
	robot.css({'left':(rx/144*100-6.2625)+'%','top':(ry/144*100-6.2625)+'%'});
	rotate(robot,rr);
}

$(".export-autonomous").click(function() {
    var exportString = JSON.stringify(keyframes);
    var pom = document.createElement('a');
    pom.setAttribute('target','_blank');
    pom.setAttribute('href','data:text/plain;charset=utf-8,'+encodeURIComponent(exportString));
    pom.setAttribute('download','keyframes.vcfg');
    pom.click();
});

$(".import-autonomous").click(function() {
    var fileInput = $('<input type="file" name="files[]" />');
    fileInput.on('change',function(event) {
        var file = $(this).get(0).files[0];
        var reader = new FileReader();
        reader.readAsText(file,"UTF-8");
        reader.onload = function(evt) {
            var content = evt.target.result;
            try {
                keyframes = JSON.parse(content);
                updateKeyframeList();
                showMessage("Autonomous loaded!");
            }
            catch(err) {
                throwError("Couldn't read the keyframe file");
            }
        };
    });
    fileInput.click();
});

function updatePlayback(comp,time) {
	setTimeout(function() {
		for(var i = 0; i < comp.length; i ++) {
			var component = comp[i];
			var type = component['type'];
			if(type == 0) {
				var robot = $(".keyframes-field-robot");
				var x = component['x'];
				var y = component['y'];
				var r = component['r'];
				robot.css({'left':(x/144*100-6.2625)+'%','top':(y/144*100-6.2625)+'%'});
				rotate(robot,r);
			}
			if(type == 1) {
				var id = component['id'];
				var value = component['value'];
				var min = parseInt($("#c"+id).data("min"));
				var max = parseInt($("#c"+id).data("max"));
				var bar = $("#c"+id).children().first();
				var span = $("#c"+id).find('span');
				span.text(value);
				if(min != max) {	
					bar.css({'width':(value-min)/max*100+'%'});
				}
			}
			if(type == 2) {
				var id = component['id'];
				var value = component['value'];
				$("#c"+id).text(value==0?"Off":"On");
				$("#c"+id).css({'border':'1px solid '+(value==0?'#CC7777':'#77CC77')});
			}
			if(type == 3) {
				var id = component['id'];
				var value = component['value'];
				$("#c"+id).text(value);
				if(value > 0) {
					$("#c"+id).css({'border':'1px solid #77CC77'});
				}
				if(value < 0) {
					$("#c"+id).css({'border':'1px solid #CC7777'});
				}
				if(value == 0) {
					$("#c"+id).css({'border':'1px solid #CFCFCF'});
				}
			}
		}
	},time);
}

$(".play-autonomous").click(function() {
	$(".keyframes-toolbar").fadeOut({'duration':200,'queue':false});
	$(".keyframes-left-overlay").fadeIn({'duration':200,'queue':false});
	$(".keyframes-right-overlay").fadeIn(200);
	$(".keyframes-components").empty();
	$(".keyframes-field-marker").remove();
	for(var i = 0; i < components.length; i ++) {
		var component = components[i];
		if(component['type'] > 0) {
			$(".keyframes-components").append($('<h3>'+component['name']+'</h3>'));
			var playbackComponent = $('<div class="keyframes-playback-component" id="c'+i+'"></div>');
			if(component['type'] == 1) {
				var min = 0;
				var max = undefined;
				for(var j = 0; j < keyframes.length; j ++) {
					var keyframe = keyframes[j];
					if(keyframe['type'] == 'pid' && getProperty(keyframe['properties'],'target',undefined) == component['name']) {
						var value = parseInt(getProperty(keyframe['properties'],'value',0));
						if(max == undefined) max = value;
						if(value < min) min = value;
						if(value > max) max = value;
					}
				}
				if(min == undefined) min = 0;
				if(max == undefined) max = 0;
				playbackComponent.data("min",min);
				playbackComponent.data("max",max);
				playbackComponent.append($('<div class="keyframes-playback-lift"></div>'));
				playbackComponent.append($('<span style="position:relative;z-index:2;"></span>'));
			}
			$(".keyframes-components").append(playbackComponent);
		}
	}
	var rx = 0.0;
	var ry = 0.0;
	var rr = 0.0;
	var time = 0;
	var values = {};
	for(var i = 0; i < keyframes.length; i ++) {
		var keyframe = keyframes[i];
		var properties = keyframe['properties'];
		var type = keyframe['type'];
		if(type == 'init') {
			var comp = [];
     		var startingTile = getProperty(properties,'start',1);
     		switch(startingTile) {
    		    case 1: {
    		        rx = 36;
    		        ry = 132;
    		        break;
    		    }
    		    case 2: {
    		        rx = 108;
    		        ry = 132;
    		        break;
    		    }
    		    case 3: {
    		        rx = 36;
    		        ry = 12;
        		    break;
        		}
        		case 4: {
        		    rx = 108;
        		    ry = 12;
        		    break;
        		}
    		}
    		rr = getProperty(properties,'rotation',0.0);
    		rx += getProperty(properties,'xoffset',0.0);
    		ry += getProperty(properties,'yoffset',0.0);
			comp.push({'type':0,'x':rx,'y':ry,'r':rr});
			for(var j = 0; j < components.length; j ++) {
				var component = components[j];
				if(component['type'] > 0) {
					values[j] = getProperty(properties,'-'+component['name'],0);
					comp.push({'type':component['type'],'id':j,'value':getProperty(properties,'-'+component['name'],0)});
				}
			}
			updatePlayback(comp,time);
			time += 1000;
		}
		if(type == 'pid') {
			var componentName = getProperty(properties,'target',undefined);
			var component = getComponent(componentName);
			if(component) {
				var realComponent = component[1];
				if(realComponent['type'] == 0) {
					var action = getProperty(properties,'action','drive');
					var value = getProperty(properties,'value',0);
					var sign = value>0?1:-1;
					if(action == 'drive') {
						for(var j = 0; j < Math.abs(value); j ++) {
							var angle = (rr-90)*Math.PI/180;
							rx += Math.cos(angle)*sign;
							ry += Math.sin(angle)*sign;
							var comp = [];
							comp.push({'type':0,'x':rx,'y':ry,'r':rr});
							updatePlayback(comp,time);
							time += 25;
						}
					}else
					{
						for(var j = 0; j < Math.abs(value); j ++) {
							rr += sign;
							var comp = [];
							comp.push({'type':0,'x':rx,'y':ry,'r':rr});
							updatePlayback(comp,time);
							time += 10;
						}
					}
				}
				if(realComponent['type'] == 1) {
					var value = getProperty(properties,'value',0);
					var index = component[0];
					var difference = value-values[index];
					var direction = difference>0?1:-1;
					for(var j = 0; j < Math.abs(difference); j ++) {
						var comp = [];
						values[index] += direction;
						comp.push({'type':1,'id':index,'value':values[index]});
						updatePlayback(comp,time);
						time += 10;
					}
				}
			}
		}
		if(type == 'time') {
			var componentName = getProperty(properties,'target',undefined);
			var component = getComponent(componentName);
			if(component) {
				var realComponent = component[1];
				var comp = [];
				comp.push({'type':realComponent['type'],'id':component[0],'value':getProperty(properties,'value',0)});
				updatePlayback(comp,time);
				time += parseFloat(getProperty(properties,'time',0));
			}
		}
	}
	setTimeout(function() {
		$(".keyframes-toolbar").fadeIn({'duration':200,'queue':false});
		$(".keyframes-left-overlay").fadeOut({'duration':200,'queue':false});
		$(".keyframes-right-overlay").fadeOut(200);
		setTimeout(function() { $(".keyframes-frame.selected").click(); },200);
	},time);
});

function generateField() {
	$(".keyframes-field-tiles").empty();
	var robot = $('<div class="keyframes-field-robot"><i class="glyphicon glyphicon-arrow-up"></i></div>');
	$(".keyframes-field-tiles").append(robot);
	moveRobot();
	for(var i = 0; i < 6; i ++) {
		for(var j = 0; j < 6; j ++) {
			var element = field[j][i];
			var tile = $('<div class="keyframes-field-tile"></div>');
			if(element == 0) {
				var tileColor = (i%2 == j%2)?'#DDDDDD':'#D4D4D4';
				tile.css({'background':tileColor})
			}
			if(element == 1 || element == 2) {
				tile.css({'background':'#CC6666'});
			}
			if(element == 3 || element == 4) {
				tile.css({'background':'#6666CC'});
			}
			tile.css({'top':j*16.7+'%','left':i*16.7+'%'});
			$(".keyframes-field-tiles").append(tile);
		}
	}
}

$(".donate-button").click(function() {
	$(".donate-text").html("Thanks! &#9825;");
	var pom = document.createElement('a');
    pom.setAttribute('target','_blank');
    pom.setAttribute('href','https://www.paypal.com/cgi-bin/webscr?cmd=_donations&business=KQUBH9BSXFYMY&lc=US&item_name=VEX%20Autonomous%20Planner&currency_code=USD&bn=PP%2dDonationsBF%3abtn_donate_LG%2egif%3aNonHosted');
    pom.click();
});

$("#code-export-text").on('keydown',function(event) {
	var allowedKeys = [33,34,37,38,39,40];
	if(allowedKeys.indexOf(event.keyCode) > -1) return;
	if(event.metaKey || event.ctrlKey) {
		if(event.keyCode == 67 || event.keyCode == 65) return;
	}
	event.preventDefault();
});

function addOptionToBox(optionsGroup,index) {
	var optionsBox = optionsGroup.children().first();
	var optionType = optionsGroup.data("type");
	var newOption =  $('<span class="option" data-type="'+optionType+'" data-index="'+index+'"><span>'+options[optionType][index]+'</span></span>');
	var newOptionClose = $('<img class="option-close" src="images/icons/cancel.png" />');
	newOptionClose.click(function() {
		$(this).parent().remove();
		saveComponents();
	});
	newOption.click(function() {
		var subOptions = options[$(this).data("type")];
		var index = $(this).data("index");
		index ++;
		if(index >= subOptions.length) index = 0;
		$(this).data("index",index);
		$(this).children().first().text(subOptions[index]);
		saveComponent();
	});
	newOption.append(newOptionClose);
	optionsBox.append(newOption);
}

$(".options-button").click(function() {
	addOptionToBox($(this).parent(),0);
	saveComponent();
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
	$("#"+$(".tab.selected").data("panel")).fadeIn({'duration':200,'queue':false});
	resizeField();
	updateComponentList();
	updateKeyframeList();
	moveRobot();
	if($(".tab.selected").index() == 1) {
		var driveExists = false;
		for(var i = 0; i < components.length; i ++) {
			if(components[i]['type'] == 0) driveExists = true;
		}
		if(!driveExists) {
			$(".keyframes-no-drive").show();
		}else
		{
			setTimeout(function() { $(".keyframes-no-drive").fadeOut({'duration':200,'queue':false}); }, 200);
		}
	}else
	{
		setTimeout(function() { $(".keyframes-no-drive").fadeOut({'duration':200,'queue':false}); }, 200);
	}
	if($(".tab.selected").index() == 2) {
		var canExport = false;
		for(var i = 0; i < components.length; i ++) {
			if(components[i]['type'] == 0) canExport = true;
		}
		canExport = canExport && (keyframes.length > 1);
		if(!canExport) {
			$(".code-blank-pane").show();
		}else
		{
			setTimeout(function() { $(".code-blank-pane").fadeOut({'duration':200,'queue':false}); }, 200);
			$("#code-export-text").html(parse(components,keyframes));
			$("#code-export-text").each(function(i,block) {
				hljs.highlightBlock(block);
			});
		}
	}else
	{
		setTimeout(function() { $(".code-blank-pane").fadeOut({'duration':200,'queue':false}); }, 200);
	}
}

$(".tab").click(function() {
	if($(this).hasClass("selected")) return;
	$(".tab").removeClass("selected");
	$(this).addClass("selected");
	switchTab();
});

switchTab();
updateComponentList();
updateKeyframeList();
generateField();
