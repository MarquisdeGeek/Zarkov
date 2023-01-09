const zarkov = require('../src/index');
const myProgram = require('./code1-maths.js')();


const myProcess = myProgram.compile();

console.log("Run the process under inline debugger/tracer")

const debugOptions = { "trace": true, showState: false, breakAt:{} };
myProcess.debug(debugOptions);
myProcess.run({ 'start': zarkov.const(10) });
