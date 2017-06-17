'use strict';
/**
 * @description 开启和服务器的心跳包，接收服务器的cpu-profiling请求
 **/
'use strict';
const v8Profiler = require('v8-profiler');
const TCP = require('../../../build/Release/addons.node').TCP;
const cTimer = require('../../../lib/timer');
const analysisLib = require('v8-cpu-analysis');

let doingCpuProfiling = false;

function doCpuProfilingP(uuid, config, cb) {
    if (doingCpuProfiling) {
        return;
    }
    doingCpuProfiling = true;
    v8Profiler.startProfiling(uuid, true);
    cTimer.addTimer(() => {
        let profile = v8Profiler.stopProfiling(uuid);
        cb(profile);
        profile.delete();
        doingCpuProfiling = false;
        //v8Profiler.deleteAllProfiles();
    }, config.CPU_PROFILING_TIME);
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

module.exports = function startTcpClient(config, helper) {
    let tcp = new TCP(config.TCP_INFO.HOST, config.TCP_INFO.PORT);
    let socket_fd = tcp.connect();
    reconnect(socket_fd, tcp);
    tcp.receiveMessage(new Function());


    //检查收包List列表中是否有命令信息（顺带判断进程是否阻塞）
    cTimer.addTimer(() => {
        let nowResponseList = tcp.getRecvMessageList();
        nowResponseList.forEach(item => {
            let dataArr = item.split('\n\n');
            for (let i = 0, len = dataArr.length - 1; i < len; i++) {
                let tmp = helper.jsonParse(dataArr[i]);
                tmp.data = helper.jsonParse(tmp.data);
                if (tmp.type === config.MESSAGE_TYPE[2]) {
                    doCpuProfilingP(tmp.data.uuid, config, function (profiler) {
                        let result = {
                            type: config.MESSAGE_TYPE[3],
                            uuid: tmp.data.uuid,
                            data: JSON.stringify({
                                longFunctions: analysisLib(profiler, tmp.data.timeout || 500, false, true, {limit: config.FUNCTIONS_ANALYSIS.LONG_FUNCTIONS_LIMIT}),
                                bailoutFunctions: analysisLib(profiler, null, true, true, {limit: config.FUNCTIONS_ANALYSIS.BAILOUT_FUNCTIONS_LIMIT})
                            })
                        };
                        tcp.sendMessage(JSON.stringify(result) + '\n\n');
                    });
                }
            }

        });
    }, 2 * 1000, true);

    cTimer.addTimer(() => {
        tcp.sendMessage(JSON.stringify({
                type: config.MESSAGE_TYPE[0],
                data: JSON.stringify({pid: `${config.appName}::${process.pid}`})
            }) + '\n\n');
    }, config.HEARTBEAT_TIME, true);
};