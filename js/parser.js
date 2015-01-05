var exportCode = "";

function parse(config,frames) {
	exportCode = "";
	var tunable = [];
	for(var i = 0; i < components.length; i ++) {
		if(components[i]['type'] < 2) tunable.push(components[i]);
	}
	writeLine('/**');
	writeLine();
	writeLine('\tVEX Autonomous Planner');
	writeLine('\tGenerated '+(new Date()).toUTCString());
	writeLine();
	writeLine('\tUsage: Tune variables in vap_init() to robot. Call vap_autonomous() to run the autonomous program.');
	writeLine();
	writeLine('\tVEX Autonomous Planner &copy; Ruiqi Mao 2014');
	writeLine('\tAll Rights Reserved');
	writeLine();
	writeLine('**/');
	writeLine();
	writeLine('float vap_kP['+tunable.length+'], vap_kI['+tunable.length+'], vap_kD['+tunable.length+'], vap_kL['+tunable.length+'];');
	writeLine('long vap_tolerance['+tunable.length+'];');
	writeLine('long vap_ticksPerRotation, vap_ticksPerFoot, vap_waitBetweenPID;');
	writeLine();
	writeLine('void vap_init() {');
	writeLine();
	for(var i = 0; i < tunable.length; i ++) {
		var component = tunable[i];
		writeLine('\tvap_kP['+i+'] = 0.0; // Proportional Constant for '+component['name']);
		writeLine('\tvap_kI['+i+'] = 0.0; // Integral Constant for '+component['name']);
		writeLine('\tvap_kD['+i+'] = 0.0; // Derivative Constant for '+component['name']);
		writeLine('\tvap_kL['+i+'] = 0.0; // Integral Limit for '+component['name']);
		writeLine('\tvap_tolerance['+i+'] = 0; // Tolerance for '+component['name']);
		writeLine();
	}
	writeLine('\tvap_ticksPerRotation = 0; // Number of ticks per full rotation');
	writeLine('\tvap_ticksPerFoot = 0; // Number of ticks per foot traveled');
	writeLine('\tvap_waitBetweenPID = 0; // Number of milliseconds to wait after each PID move');
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
	writeLine('long vap_target['+init.length+'] = {'+initTargetString+'};');
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
	writeLine('\tlong error['+error.length+'] = {'+errorString+'};');
	writeLine('\tlong pError['+error.length+'] = {'+errorString+'};');
	writeLine('\tlong p['+error.length+'] = {'+errorString+'};');
	writeLine('\tlong i['+error.length+'] = {'+errorString+'};');
	writeLine('\tlong d['+error.length+'] = {'+errorString+'};');
	writeLine();
	writeLine('\twhile(true) {');
	writeLine();
	var errorIndex = 0;
	var targetIndex = 0;
	var tunableIndex = 0;
	for(var i = 0; i < components.length; i ++) {
		var component = components[i];
		if(component['type'] == 0) {
			var encoderLeft = parseInt(component['drive-encoder-left']);
			var encoderRight = parseInt(component['drive-encoder-right']);
			var sensorNameLeft = encoderLeft<12?'sensorValue[dgtl'+(encoderLeft+1)+']':'nMotorEncoder[port'+(encoderLeft-11)+']';
			var sensorNameRight = encoderRight<12?'sensorValue[dgtl'+(encoderRight+1)+']':'nMotorEncoder[port'+(encoderRight-11)+']';
			writeLine('\t\terror['+errorIndex+'] = vap_target['+targetIndex+'] - '+sensorNameLeft+';');
			writeLine('\t\terror['+(errorIndex+1)+'] = vap_target['+(targetIndex+1)+'] - '+sensorNameRight+';');
			writeLine('\t\tp['+errorIndex+'] = error['+errorIndex+'];');
			writeLine('\t\tp['+(errorIndex+1)+'] = error['+(errorIndex+1)+'];');
			writeLine('\t\ti['+errorIndex+'] = abs(i['+errorIndex+'] + error['+errorIndex+']) < vap_kL['+tunableIndex+'] ? '+
				'i['+errorIndex+'] + error['+errorIndex+'] : sgn(i['+errorIndex+'] + error['+errorIndex+'])*vap_kL['+tunableIndex+'];');
			writeLine('\t\ti['+(errorIndex+1)+'] = abs(i['+(errorIndex+1)+'] + error['+(errorIndex+1)+']) < vap_kL['+tunableIndex+'] ? '+
				'i['+(errorIndex+1)+'] + error['+(errorIndex+1)+'] : sgn(i['+(errorIndex+1)+'] + error['+(errorIndex+1)+'])*vap_kL['+tunableIndex+'];');
			writeLine('\t\td['+errorIndex+'] = error['+errorIndex+'] - pError['+errorIndex+'];');
			writeLine('\t\td['+(errorIndex+1)+'] = error['+(errorIndex+1)+'] - pError['+(errorIndex+1)+'];');
			var motorsLeft = component['drive-motors-left'];
			var motorsRight = component['drive-motors-right'];
			for(var j = 0; j < motorsLeft.length; j ++) {
				var port = parseInt(motorsLeft[j]);
				writeLine('\t\tmotor[port'+(port+1)+'] = p['+errorIndex+']*vap_kP['+tunableIndex+']'
					+' + i['+errorIndex+']*vap_kI['+tunableIndex+']'
					+' + d['+errorIndex+']*vap_kD['+tunableIndex+'];');
			}
			for(var j = 0; j < motorsRight.length; j ++) {
				var port = parseInt(motorsRight[j]);
				writeLine('\t\tmotor[port'+(port+1)+'] = p['+(errorIndex+1)+']*vap_kP['+tunableIndex+']'
					+' + i['+(errorIndex+1)+']*vap_kI['+tunableIndex+']'
					+' + d['+(errorIndex+1)+']*vap_kD['+tunableIndex+'];');
			}
			errorIndex += 2;
			targetIndex += 2;
			tunableIndex ++;
		}
		if(component['type'] == 1) {
			var encoder = parseInt(component['lift-encoder']);
			var sensorName = encoder<20?'sensorValue['+(encoder<8?'in'+(encoder+1):'dgtl'+(encoder-7))+']':'nMotorEncoder[port'+(encoder-19)+']';
			writeLine('\t\terror['+errorIndex+'] = vap_target['+targetIndex+'] - '+sensorName+';');
			writeLine('\t\tp['+errorIndex+'] = error['+errorIndex+'];');
			writeLine('\t\ti['+errorIndex+'] = abs(i['+errorIndex+'] + error['+errorIndex+']) < vap_kL['+i+'] ? '+
				'i['+errorIndex+'] + error['+errorIndex+'] : sgn(i['+errorIndex+'] + error['+errorIndex+'])*vap_kL['+tunableIndex+'];');
			writeLine('\t\td['+errorIndex+'] = error['+errorIndex+'] - pError['+errorIndex+'];');
			var motors = component['lift-motors'];
			for(var j = 0; j < motors.length; j ++) {
				var port = parseInt(motors[j]);
				writeLine('\t\tmotor[port'+(port+1)+'] = p['+errorIndex+']*vap_kP['+tunableIndex+']'
					+' + i['+errorIndex+']*vap_kI['+tunableIndex+']'
					+' + d['+errorIndex+']*vap_kD['+tunableIndex+'];');
			}
			errorIndex ++;
			targetIndex ++;
			tunableIndex ++;
		}
		if(component['type'] == 2) {
			var ports = component['pneumatic-ports'];
			for(var j = 0; j < ports.length; j ++) {
				var port = parseInt(ports[j]);
				writeLine('\t\tsensorValue[dgtl'+(port+1)+'] = vap_target['+targetIndex+'];');
			}
			targetIndex ++;
		}
		if(component['type'] == 3) {
			var motors = component['other-motors'];
			for(var j = 0; j < motors.length; j ++) {
				var motor = parseInt(motors[j]);
				writeLine('\t\tmotor[port'+(motor+1)+'] = vap_target['+targetIndex+'];');
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
	writeLine();
	writeLine('void vap_autonomous() {');
	writeLine();
	writeLine('\tvap_init();');
	writeLine();
	writeLine('\tstartTask(vap_pid);');
	writeLine();
	for(var i = 1; i < frames.length; i ++) {
		var keyframe = frames[i];
		var properties = keyframe['properties'];
		if(keyframe['type'] == 'pid') {
			var targetName = getProperty(properties,'target',undefined);
			var component = getComponent(targetName);
			if(component) {
				var realComponent = component[1];
				var value = parseInt(getProperty(properties,'value',0));
				var targetIndex = 0;
				var tunableIndex = 0;
				for(var j = 0; j < components.length; j ++) {
					if(components[j] == realComponent) break;
					if(components[j]['type'] == 0) targetIndex += 2; else targetIndex ++;
					if(components[j]['type'] < 2) tunableIndex ++;
				}
				if(realComponent['type'] == 0) {
					var action = getProperty(properties,'action','drive');
					if(action == 'drive') {
						writeLine('\tvap_target['+targetIndex+'] += '+value+'*vap_ticksPerFoot/12;');
						writeLine('\tvap_target['+(targetIndex+1)+'] += '+value+'*vap_ticksPerFoot/12;');
					}
					if(action == 'turn') {
						writeLine('\tvap_target['+targetIndex+'] += '+(value/360)+'*vap_ticksPerRotation*vap_ticksPerFoot/12;');
						writeLine('\tvap_target['+(targetIndex+1)+'] -= '+(value/360)+'*vap_ticksPerRotation*vap_ticksPerFoot/12;');
					}
					var encoderLeft = parseInt(realComponent['drive-encoder-left']);
					var encoderRight = parseInt(realComponent['drive-encoder-right']);
					var sensorNameLeft = encoderLeft<12?'sensorValue[dgtl'+(encoderLeft+1)+']':'nMotorEncoder[port'+(encoderLeft-11)+']';
					var sensorNameRight = encoderRight<12?'sensorValue[dgtl'+(encoderRight+1)+']':'nMotorEncoder[port'+(encoderRight-11)+']';
					writeLine('\twhile(abs('+sensorNameLeft+' - vap_target['+targetIndex+']) > vap_tolerance['+tunableIndex+']'
						+' && abs('+sensorNameRight+' - vap_target['+(targetIndex+1)+']) > vap_tolerance['+tunableIndex+']);');
				}
				if(realComponent['type'] == 1) {
					writeLine('\tvap_target['+targetIndex+'] += '+value+';');
					var encoder = parseInt(realComponent['lift-encoder']);
					var sensorName = encoder<20?'sensorValue['+(encoder<8?'in'+(encoder+1):'dgtl'+(encoder-7))+']':'nMotorEncoder[port'+(encoder-19)+']';
					writeLine('\twhile(abs('+sensorName+' - vap_target['+targetIndex+']) > vap_tolerance['+tunableIndex+']);');
				}
			}
			writeLine('\twait1Msec(vap_waitBetweenPID);');
		}
		if(keyframe['type'] == 'time') {
			var targetName = getProperty(properties,'target',undefined);
			var component = getComponent(targetName);
			if(component) {
				var realComponent = component[1];
				var value = parseInt(getProperty(properties,'value',0));
				var time = parseInt(getProperty(properties,'time',0));
				var targetIndex = 0;
				for(var j = 0; j < components.length; j ++) {
					if(components[j] == realComponent) break;
					if(components[j]['type'] == 0) targetIndex += 2; else targetIndex ++;
				}
				writeLine('\tvap_target['+targetIndex+'] = '+value+';');
				writeLine('\twait1Msec('+time+');');
			}
		}
	}
	writeLine();
	writeLine('\tstopTask(vap_pid);');
	writeLine();
	writeLine('}');
	return exportCode;
}

function writeLine(line) {
	if(line == undefined) line = "";
	line = String(line);
	exportCode += line+"<br />";
}
