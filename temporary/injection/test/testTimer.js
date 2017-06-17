/**
 * Created by huangyijun on 17/2/15.
 */
const v8Profiler = require('v8-profiler');
const TCP = require('../build/Release/addons.node').TCP;
const cTimer = require('../lib/timer');

cTimer.addTimer(() => console.log('2s after...'), 2000);

cTimer.addTimer(() => console.log('5s after...'), 5000);

let i = 0;
let tcp = new TCP('127.0.0.1', 8082);
tcp.connect();
//收包
tcp.receiveMessage(new Function());

//定时器检测
cTimer.addTimer(() => {
    let nowResponseList = tcp.getRecvMessageList();
    let needCpuProfile = nowResponseList.some(item => {
        let dataArr = item.split('\n\n');
        for (let i = 0, len = dataArr.length - 1; i < len; i++) {
            let tmp = JSON.parse(dataArr[i]);
            if (tmp.type === 'DO_CPU_PROFILER') return true;
        }

        return false;
    });

    if(needCpuProfile) doCpuProfiling();
}, 1000, true);

//开启心跳定时器
let interval = cTimer.addTimer(() => {
    if (i < 50000) {
        console.log('-----Repeat after 60s...');
        tcp.sendMessage(JSON.stringify({a: 1, b: 2}) + '\n\n');
    } else {
        cTimer.removeTimer(interval);
    }
    i++;
}, 60 * 1000, true);


//各种阻塞情况
let defer = 0;
setInterval(() => {
    if (defer === 2) {
        console.log('start dead regexp...');
        require('./regexp-dead').longLoop();
        //require('./regexp-dead').deadResexp();
    }
    defer++;
}, 1000);

//做cpu-profiling
function doCpuProfiling() {
    console.log("开始CpuProfiling...");
    v8Profiler.startProfiling('title', true);
    cTimer.addTimer(() => {
        console.log("结束CpuProfiling...");
        let profile = v8Profiler.stopProfiling('title');
        console.log(12333, JSON.stringify(profile));
        profile.delete();
        //v8Profiler.deleteAllProfiles();
    }, 10 * 1000);
}
