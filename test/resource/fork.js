'use strict';

/**
 * @param {*} message 
 * @description 发送数据给主进程
 */
function sendMessage(message) {
    return new Promise((resolve, reject) => {
        process.send(message, function (err) {
            err && reject(err) || resolve();
        });
    })
}

/*process.on('message', msg => {

});*/

sendMessage(process.argv[2]);