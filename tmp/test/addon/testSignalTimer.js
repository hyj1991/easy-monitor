/**
 * Created by huangyijun on 17/2/13.
 */
const timer = require('../../build/Release/addons.node').signal_timer;

//1.
console.log(timer);

//2.
let time = Date.now();
timer.register(function () {
    console.log(`${((Date.now() - time) / 1000) | 0} s`);
}, 1, true);


require('http').createServer(new Function()).listen(56789);

/*while (1) {
 }*/

console.log('After while ');