var exportCode = "";

function parse(config,frames) {
	exportCode = "";
	var tunable = [];
	for(var i = 0; i < components.length; i ++) {
		if(components[i]['type'] < 2) tunable.push(components[i]);
	}
	writeLine('float kP['+tunable.length+'], kI['+tunable.length+'], kD['+tunable.length+'], kL['+tunable.length+'];');
	writeLine('int ticksPerRotation;');
	writeLine();
	writeLine('void vap_init() {');
	writeLine();
	for(var i = 0; i < tunable.length; i ++) {
		var component = tunable[i];
		writeLine('\tkP['+i+'] = 0.0; // Proportional Constant for '+component['name']);
		writeLine('\tkI['+i+'] = 0.0; // Integral Constant for '+component['name']);
		writeLine('\tkD['+i+'] = 0.0; // Derivative Constant for '+component['name']);
		writeLine('\tkL['+i+'] = 0.0; // Integral Limit for '+component['name']);
		writeLine();
	}
	writeLine('\tticksPerRotation = 0; // Number of ticks per full rotation');
	writeLine();
	writeLine('}');
	writeLine();
	var init = [];
	var initKeyframe = frames[0];
	var initProperties = initKeyframe['properties'];
	for(var i = 0; i < components.length; i ++) {
		var component = components[i];
		if(component['type'] == 0) {
			init.push('0');
			init.push('0');
		}
		if(component['type'] == 1 || component['type'] == 2) {
			init.push(String(getProperty(initProperties,'-'+component['name'],0)));
		}
		if(component['type'] == 3) {
			init.push('0');
		}
	}
	var initTargetString = init.join(', ');
	writeLine('int target['+init.length+'] = {'+initTargetString+'};');
	writeLine();
	writeLine('task vap_pid() {');
	writeLine();
	var error = [];
	for(var i = 0; i < tunable.length; i ++) {
		var component = tunable[i];
		if(component['type'] == 0) {
			error.push('0');
			error.push('0');
		}
		if(component['type'] == 1) {
			error.push('0');
		}
	}
	var errorString = error.join(', ');
	writeLine('\tint error['+error.length+'] = {'+errorString+'};');
	writeLine('\tint pError['+error.length+'] = {'+errorString+'};');
	writeLine('\tint p['+error.length+'] = {'+errorString+'};');
	writeLine('\tint i['+error.length+'] = {'+errorString+'};');
	writeLine('\tint d['+error.length+'] = {'+errorString+'};');
	writeLine();
	writeLine('\twhile(true) {');
	writeLine();
	var errorIndex = 0;
	var targetIndex = 0;
	for(var i = 0; i < components.length; i ++) {
		var component = components[i];
		if(component['type'] == 0) {
			var encoderLeft = parseInt(component['drive-encoder-left']);
			var encoderRight = parseInt(component['drive-encoder-right']);
			var sensorNameLeft = encoderLeft<12?'sensorValue[dgtl'+(encoderLeft+1)+']':'nMotorEncoder[port'+(encoderLeft-11)+']';
			var sensorNameRight = encoderRight<12?'sensorValue[dgtl'+(encoderRight+1)+']':'nMotorEncoder[port'+(encoderRight-11)+']';
			writeLine('\t\terror['+errorIndex+'] = target['+targetIndex+'] - '+sensorNameLeft+';');
			writeLine('\t\terror['+(errorIndex+1)+'] = target['+(targetIndex+1)+'] - '+sensorNameRight+';');
			writeLine('\t\tp['+errorIndex+'] = error['+errorIndex+'];');
			writeLine('\t\tp['+(errorIndex+1)+'] = error['+(errorIndex+1)+'];');
			writeLine('\t\ti['+errorIndex+'] = abs(i['+errorIndex+'] + error['+errorIndex+']) < kL['+i+'] ? '+
				'i['+errorIndex+'] + error['+errorIndex+'] : sgn(i['+errorIndex+'] + error['+errorIndex+'])*kL['+i+'];');
			writeLine('\t\ti['+(errorIndex+1)+'] = abs(i['+(errorIndex+1)+'] + error['+(errorIndex+1)+']) < kL['+i+'] ? '+
				'i['+(errorIndex+1)+'] + error['+(errorIndex+1)+'] : sgn(i['+(errorIndex+1)+'] + error['+(errorIndex+1)+'])*kL['+i+'];');
			writeLine('\t\td['+errorIndex+'] = error['+errorIndex+'] - pError['+errorIndex+'];');
			writeLine('\t\td['+(errorIndex+1)+'] = error['+(errorIndex+1)+'] - pError['+(errorIndex+1)+'];');
			var motorsLeft = component['drive-motors-left'];
			var motorsRight = component['drive-motors-right'];
			for(var j = 0; j < motorsLeft.length; j ++) {
				var port = parseInt(motorsLeft[j]);
				writeLine('\t\tmotor[port'+(port+1)+'] = p['+errorIndex+']*kP['+i+'] + i['+errorIndex+']*kI['+i+'] + d['+errorIndex+']*kD['+i+'];');
			}
			for(var j = 0; j < motorsRight.length; j ++) {
				var port = parseInt(motorsRight[j]);
				writeLine('\t\tmotor[port'+(port+1)+'] = p['+(errorIndex+1)+']*kP['+i+'] + i['+(errorIndex+1)+']*kI['+i+'] + d['+(errorIndex+1)+']*kD['+i+'];');
			}
			errorIndex += 2;
			targetIndex += 2;
		}
		if(component['type'] == 1) {
			var encoder = parseInt(component['lift-encoder']);
			var sensorName = encoder<20?'sensorValue['+(encoder<8?'in'+(encoder+1):'dgtl'+(encoder-7))+']':'nMotorEncoder[port'+(encoder-19)+']';
			writeLine('\t\terror['+errorIndex+'] = target['+targetIndex+'] - '+sensorName+';');
			writeLine('\t\tp['+errorIndex+'] = error['+errorIndex+'];');
			writeLine('\t\ti['+errorIndex+'] = abs(i['+errorIndex+'] + error['+errorIndex+']) < kL['+i+'] ? '+
				'i['+errorIndex+'] + error['+errorIndex+'] : sgn(i['+errorIndex+'] + error['+errorIndex+'])*kL['+i+'];');
			writeLine('\t\td['+errorIndex+'] = error['+errorIndex+'] - pError['+errorIndex+'];');
			var motors = component['lift-motors'];
			for(var j = 0; j < motors.length; j ++) {
				var port = parseInt(motors[j]);
				writeLine('\t\tmotor[port'+(port+1)+'] = p['+errorIndex+']*kP['+i+'] + i['+errorIndex+']*kI['+i+'] + d['+errorIndex+']*kD['+i+'];');
			}
			errorIndex ++;
			targetIndex ++;
		}
		if(component['type'] == 2) {
			var ports = component['pneumatic-ports'];
			for(var j = 0; j < ports.length; j ++) {
				var port = parseInt(ports[j]);
				writeLine('\t\tsensorValue[dgtl'+(port+1)+'] = target['+targetIndex+'];');
			}
			targetIndex ++;
		}
		if(component['type'] == 3) {
			var motors = component['other-motors'];
			for(var j = 0; j < motors.length; j ++) {
				var motor = parseInt(motors[j]);
				writeLine('\t\tmotor[port'+(port+1)+'] = target['+targetIndex+'];');
			}
			targetIndex ++;
		}
		writeLine();
	}
	writeLine('\t\twait1Msec(25);');
	writeLine();
	writeLine('\t}');
	writeLine();
	writeLine('}');
	return exportCode;
}

function writeLine(line) {
	if(line == undefined) line = "";
	line = String(line);
	exportCode += line+"<br />";
}
