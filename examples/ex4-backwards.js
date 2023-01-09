const zarkov = require('../src/index');
const myProgram = require('./code1-maths.js')();


const myProcess = myProgram.compile();
const debugOptions = { "trace": true, showState: false, breakAt:{} };

console.log("Run it forwards...")
myProcess.run({ 'start': zarkov.const(10) });

console.log("And now do it backwards...")
let state = myProcess.restart();

debugOptions.breakAt['a'] = function(name, value) {
	return (value == 12);
}


while(state.isRunning()) {
	state = myProcess.back();
}
console.log(`State: ${state.getRunningState()}`);
