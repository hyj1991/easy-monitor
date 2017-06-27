/**
 * Created by huangyijun on 17/2/21.
 */
'use strict';
const TCP = require('../../build/Release/addons.node').TCP;

//1.
console.log(TCP);

//2.
const tcp = new TCP("127.0.0.1", 8082);
console.log(tcp);
tcp.connect();
setInterval(() => tcp.sendMessage(JSON.stringify({a: 1, b: 2}) + '\n\n'), 1000);

//3.
tcp.receiveMessage(function (data) {
    console.log(12333, data);
});
// tcp.connect();

//4.
setInterval(() => console.log(12333, tcp.getRecvMessageList().join(', ')), 2000);

//5.
console.log(tcp.__proto__);