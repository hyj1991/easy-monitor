'use strict';
const lodash = require('lodash');
const co = require('co');

module.exports = function (server) {
    //取出公共对象
    const common = this.common;
    const config = this.config;
    const dbl = this.dbl;
    const controller = this.controller;
    const cacheUtils = common.cache;
    //同一时间只允许业务进程进行一次 profiling 操作
    const doingProfiling = { cpu: false, mem: false };

    //取出开始 profiling 操作的类型，并且设置对应的处理函数
    const profilerType = config.message && config.message.request && config.message.request[2];

    /**
     * @param {socket} socket @param {string} data
     * @description 给 tcp 请求设置回调函数，本回调函数处理 cpu / memory profiling 操作
     */
    controller[profilerType] = function (socket, data) {
        return co(_start, socket, data);

        /**
         * @param {socket} socket @param {string} data
         * @description 内部方法，具体处理开始 profiling 逻辑
         */
        function* _start(socket, data) {
            data = common.utils.jsonParse(data);
            //如果已经在进行 profing 操作, 直接返回
            if (doingProfiling[data.opt]) return;
            //标记为置为 true
            doingProfiling[data.opt] = true;
            const raw = lodash.merge({ opt: data.opt }, data.raw);
            const ctx = { config, common, dbl };

            //发送业务进程开始 profiling 操作
            const profilingStartMessage = common.socket.composeMessage('req', 4, { sequence: 1, raw, loadingMsg: config.profiler[data.opt].start_profiling() });
            yield common.socket.notifySide.apply(ctx, [profilingStartMessage, socket]);

            //执行 pfofiling 操作
            const profiler = yield common.profiler.profilerP(data.opt, data.params);

            //发送业务进程 profiling 操作结束
            const profilingEndMessage = common.socket.composeMessage('req', 4, { sequence: 2, raw, loadingMsg: config.profiler[data.opt].end_profiling() });
            yield common.socket.notifySide.apply(ctx, [profilingEndMessage, socket]);

            //执行分析操作
            const analysis = yield common.profiler.analyticsP(data.opt, profiler);

            //发送分析数据操作结束
            const analysisEndMessage = common.socket.composeMessage('req', 4, { sequence: 3, raw, loadingMsg: config.profiler[data.opt].end_analysis() });
            yield common.socket.notifySide.apply(ctx, [analysisEndMessage, socket]);

            //重置标记位，并返回成功响应给客户端
            doingProfiling[data.opt] = false;
            return common.socket.composeMessage('res', 3, { sequence: 4, raw, result: analysis });
        }
    }
}