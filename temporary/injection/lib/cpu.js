/**
 * @description 开启和服务器的心跳包，接收服务器的cpu-profiling请求
 **/
'use strict';
const v8Profiler = require('v8-profiler');
const TCP = require('../build/Release/addons.node').TCP;
const cTimer = require('./timer');
const analysisLib = require('/Users/huangyijun/git/v8-cpu-analysis');

// v8Profiler.startProfiling('init processor_', true);

let doingCpuProfiling = false;
let lastCpuProfilerMessage = null;

function doCpuProfilingP(options, cb) {
    if (doingCpuProfiling) {
        return;
    }
    doingCpuProfiling = true;
    v8Profiler.startProfiling('easy_monitor', true);
    cTimer.addTimer(() => {
        let profile = v8Profiler.stopProfiling('easy_monitor');
        cb(profile);
        profile.delete();
        doingCpuProfiling = false;
        //v8Profiler.deleteAllProfiles();
    }, options.CPU_PROFILING_TIME);
}

function reconnect(socket_fd, tcp) {
    if (!socket_fd) {
        setTimeout(() => {
            socket_fd = tcp.connect();
            return reconnect(socket_fd, tcp);
        }, 100);
    } else {
        return socket_fd;
    }
}

module.exports = function startTcpClient(options) {
    let tcp = new TCP(options.TCP_CONNECTION_CONFIG.host, options.TCP_CONNECTION_CONFIG.port);
    let socket_fd = tcp.connect();
    reconnect(socket_fd, tcp);
    tcp.receiveMessage(new Function());

    let isblocking_native = 0;
    let isblocking_ctimer = 0;

    //检查收包List列表中是否有命令信息（顺带判断进程是否阻塞）
    cTimer.addTimer(() => {
            if (isblocking_ctimer !== isblocking_native) {
                console.log('阻塞', isblocking_ctimer, isblocking_native);
                isblocking_native = isblocking_ctimer;
                /*if (!lastCpuProfilerMessage) {
                 doCpuProfilingP(options, function (data) {
                 lastCpuProfilerMessage = {
                 type: 'cpu.log',
                 value: {
                 longFunctions: analysisLib(data, options.FUNCTIONS_ANALYSIS.LONG_FUNCTIONS_TIMEOUT, false, true, {limit: options.FUNCTIONS_ANALYSIS.LONG_FUNCTIONS_LIMIT}),
                 bailoutFunctions: analysisLib(data, null, true, true, {limit: options.FUNCTIONS_ANALYSIS.BAILOUT_FUNCTIONS_LIMIT})
                 }
                 };
                 console.log('lastCpuProfilerMessage created!');
                 });
                 }*/

            } else {
                //非阻塞情况下清空lastCpuProfilerMessage对象
                console.log('不阻塞', isblocking_ctimer, isblocking_native);
                lastCpuProfilerMessage = null;
            }
            isblocking_ctimer++;
            setTimeout(() => isblocking_native++, 0);

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
                console.log(12333, 'needCpuProfile', Boolean(lastCpuProfilerMessage), doingCpuProfiling);
                /*if (lastCpuProfilerMessage) {
                 if (dashboard) {
                 console.log(21333, lastCpuProfilerMessage);
                 //dashboard.send([lastCpuProfilerMessage]);
                 } else {
                 tcp.sendMessage(JSON.stringify({
                 type: options.MESSAGE_TYPE[3],
                 data: JSON.stringify(lastCpuProfilerMessage)
                 }));
                 }
                 return;
                 }*/
                console.log('start', Date.now());
                doCpuProfilingP(options, function (data) {
                    let result = {
                        type: 'cpu.log',
                        value: {
                            longFunctions: analysisLib(data, options.FUNCTIONS_ANALYSIS.LONG_FUNCTIONS_TIMEOUT, false, true, {limit: options.FUNCTIONS_ANALYSIS.LONG_FUNCTIONS_LIMIT}),
                            bailoutFunctions: analysisLib(data, null, true, true, {limit: options.FUNCTIONS_ANALYSIS.BAILOUT_FUNCTIONS_LIMIT})
                        }
                    };
                    tcp.sendMessage(JSON.stringify({
                            type: options.MESSAGE_TYPE[3],
                            data: JSON.stringify(result)
                        }) + '\n\n');
                });
            }
        },
        options.CHECK_RECEIVE_MESSAGE, true
    )
    ;

    cTimer.addTimer(() => {
        tcp.sendMessage(JSON.stringify({
                type: options.MESSAGE_TYPE[0],
                data: JSON.stringify({pid: process.pid})
            }) + '\n\n');
    }, options.HEART_BEAT_INTERVAL, true);
}
;