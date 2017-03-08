/**
 * Created by huangyijun on 17/2/13.
 */
const timer = require('../../build/Release/addons.node').signal_timer;

//1.
console.log(timer);

//2.
timer.register(function () {
    console.log('Come Into Timer Check!');
}, 2);


// setInterval(()=>{},1000);

while (1) {
}

console.log('After while ');