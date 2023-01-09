const zarkov = require('../src/index');
const myProgram = require('./code1-maths.js')();


const myProcess = myProgram.compile();

console.log("Run the process manually")
const state = myProcess.start();
while(state.isRunning()) {
	state = myProcess.step();
}
