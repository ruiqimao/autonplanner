var exportCode = "";

function parse(config,frames) {
	exportCode = "";
	var tunable = [];
	for(var i = 0; i < components.length; i ++) {
		if(components[i]['type'] < 2) tunable.push(components[i]);
	}
	writeLine('int kP['+tunable.length+'];');
	writeLine('int kI['+tunable.length+'];');
	writeLine('int kD['+tunable.length+'];');
	writeLine('int kL['+tunable.length+'];');
	writeLine();
	for(var i = 0; i < tunable.length; i ++) {
		var component = tunable[i];
		writeLine('kP['+i+'] = 0.0; // Proportional Constant for '+component['name']);
		writeLine('kI['+i+'] = 0.0; // Integral Constant for '+component['name']);
		writeLine('kD['+i+'] = 0.0; // Derivative Constant for '+component['name']);
		writeLine('kL['+i+'] = 0.0; // Integral Limit for '+component['name']);
		writeLine();
	}
	return exportCode;
}

function writeLine(line) {
	if(line == undefined) line = "";
	line = String(line);
	exportCode += line+"<br />";
}
