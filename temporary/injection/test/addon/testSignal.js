'use strict';
const signal = require('../../build/Release/addons.node').signal;

console.log(process.pid);
signal.onSignalUSR1(function(){
    console.log('I am USR1');
});

signal.onSignalUSR2(function(){
    console.log('I am USR2');
});

while(true){}
// setInterval(()=>({}), 1000);