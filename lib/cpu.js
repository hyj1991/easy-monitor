/**
 * @description 开启和服务器的心跳包，接收服务器的cpu-profiling请求
 **/
const v8Profiler = require('v8-profiler');
const TCP = require('../build/Release/addons.node').TCP;
const cTimer = require('./timer');
const analysisLib = require('v8-cpu-analysis');


function doCpuProfilingP(options, cb) {
    v8Profiler.startProfiling('title', true);
    cTimer.addTimer(() => {
        let profile = v8Profiler.stopProfiling('title');
        cb(profile);
        // profile.delete();
        v8Profiler.deleteAllProfiles();
    }, options.cpu_profiling_time || 10 * 1000);
}

module.exports = function startTcpClient(options, dashboard) {
    let tcp = new TCP(options.TCP_CONNECTION_CONFIG.host, options.TCP_CONNECTION_CONFIG.port);
    tcp.connect();

    tcp.receiveMessage(new Function());
    cTimer.addTimer(() => {
        let nowResponseList = tcp.getRecvMessageList();
        let needCpuProfile = nowResponseList.some(item => {
            let dataArr = item.split('\n\n');
            for (let i = 0, len = dataArr.length - 1; i < len; i++) {
                let tmp = JSON.parse(dataArr[i]);
                if (tmp.type === options.MESSAGE_TYPE[2]) return true;
            }

            return false;
        });

        if (needCpuProfile) {
            doCpuProfilingP(options, function (data) {
                let result = {
                    type: 'cpu.log',
                    value: {
                        longFunctions: analysisLib(data, options.timeout || 50, false, true, {limit: 50}),
                        bailoutFunctions: analysisLib(data, null, true, true, {limit: 5})
                    }
                };
                if (dashboard) {
                    dashboard.send([result]);
                } else {
                    tcp.sendMessage(JSON.stringify({
                        type: options.MESSAGE_TYPE[3],
                        data: JSON.stringify(result)
                    }));
                }
            });
        }
    }, 1000, true);

    cTimer.addTimer(() => {
        tcp.sendMessage(JSON.stringify({
                type: options.MESSAGE_TYPE[0],
                data: JSON.stringify({pid: process.pid})
            }) + '\n\n');
    }, 60 * 1000, true);
};