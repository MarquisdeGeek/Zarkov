const zarkov = require('../src/index');
const myProgram = require('./code1-maths.js')();


const myProcess = myProgram.compile();

myProcess.run({ 'start': zarkov.const(10) });
