const os = require('os');
const process = require('process');

console.log('--- Substrate Characterization ---');
console.log('arch:', os.arch());
console.log('platform:', os.platform());
console.log('cpus:', os.cpus().length);
console.log('totalmem:', os.totalmem());
console.log('endianness:', os.endianness());
console.log('node version:', process.version);
console.log('v8 version:', process.versions.v8);
console.log('--- End ---');
