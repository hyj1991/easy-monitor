/**
 * @description 开启和服务器的心跳包，接收服务器的cpu-profiling请求
 **/
const v8Profiler = require('v8-profiler');
const TCP = require('../build/Release/addons.node').TCP;
const cTimer = require('./timer');
const analysisLib = require('v8-cpu-analysis');

function doCpuProfilingP(cb) {
    v8Profiler.startProfiling('title', true);
    // return new Promise((resolve, reject) => {
    cTimer.addTimer(() => {
        let profile = v8Profiler.stopProfiling('title');
        cb(profile);
        // profile.delete();
        v8Profiler.deleteAllProfiles();
    }, 10 * 1000);
    // });
}

module.exports = function startTcpClient(options, dashboard) {
    let tcp = new TCP(options.tcp.host, options.tcp.port);
    tcp.connect();

    tcp.receiveMessage(new Function());
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

        if (needCpuProfile) {
            doCpuProfilingP(function (data) {
                let result = {
                    type: 'cpu.log',
                    value: {
                        longFunctions: analysisLib(data, options.timeout || 50, false, true, {limit: 50}),
                        bailoutFunctions: analysisLib(data, null, true, true, {limit: 5})
                    }
                };
                dashboard.send([result]);
            });
        }
    }, 1000, true);

    cTimer.addTimer(() => {
        tcp.sendMessage(JSON.stringify({
                type: 'HEART_BEAT_REQUEST',
                data: JSON.stringify({pid: process.pid})
            }) + '\n\n');
    }, 60 * 1000, true);
};