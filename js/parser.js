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
	return exportCode;
}

function writeLine(line) {
	if(line == undefined) line = "";
	line = String(line);
	exportCode += line+"<br />";
}
