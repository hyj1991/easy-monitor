'use strict';
const co = require('co');
const path = require('path');
const lodash = require('lodash');

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

            //自增序列
            const sequence = { seq: 0 };

            //发送业务进程开始 profiling 操作
            const profilingStartMessage = common.socket.composeMessage('req', 4, { sequence: ++sequence.seq, raw, loadingMsg: config.profiler[data.opt].start_profiling() });
            yield common.socket.notifySide.apply(ctx, [profilingStartMessage, socket]);

            //执行 pfofiling 操作
            const notStream = Boolean(config && config.profiler && config.profiler[data.opt] && config.profiler[data.opt].optional && config.profiler[data.opt].optional.not_stream);
            const profiler = yield common.profiler.profilerP(data.opt, {
                start: Date.now(),
                /**
                 * @description 主要给 CPU Profiling 中间态使用
                 */
                callback() {
                    const duration = (Date.now() - this.start);
                    //理论上永远不会这样，保险起见加一个保护
                    const profilingTime = config.profiler.cpu.profiling_time;
                    if (profilingTime < duration) return;
                    const profilingMiddleMessage = common.socket.composeMessage('req', 4, { sequence: ++sequence.seq, raw, loadingMsg: config.profiler[data.opt].start_profiling(profilingTime - duration) });
                    //发送数据
                    return common.socket.notifySide.apply(ctx, [profilingMiddleMessage, socket]);
                }
            }, notStream);
            //发送业务进程 profiling 操作结束
            const profilingEndMessage = common.socket.composeMessage('req', 4, { sequence: ++sequence.seq, raw, loadingMsg: config.profiler[data.opt].end_profiling(null, !notStream) });
            yield common.socket.notifySide.apply(ctx, [profilingEndMessage, socket]);

            //根据配置决定启动子进程分析亦或是本地分析
            let analysis = {};
            if (Number(config.profiler.mode) === 1) {
                //子进程处理数据
                const cps = common.calculate.fork(path.join(__dirname, '../calculator.js'), { opt: data.opt, profiler: config.profiler });
                //调用内部的 send 方法
                const error = yield cps.innerSend(profiler);
                if (error) {
                    const profilingErrorMessage = common.socket.composeMessage('req', 4, { sequence: ++sequence.seq, raw, error });
                    yield common.socket.notifySide.apply(ctx, [profilingErrorMessage, socket]);
                    //重置标记位，并返回错误响应给客户端
                    doingProfiling[data.opt] = false;
                    return;
                }

                //获取结果
                analysis = yield new Promise((resolve, reject) => {
                    cps.on('message', co.wrap(function* (msg) {
                        //成功返回
                        if (msg.done) return resolve(msg.analysis);
                        //错误处理
                        if (msg.error) return reject(msg.error);
                        //中间态发送
                        const loadingMsg = msg.loadingMsg;
                        if (loadingMsg) {
                            const profilingMiddleMessage = common.socket.composeMessage('req', 4, { sequence: ++sequence.seq, raw, loadingMsg });
                            yield common.socket.notifySide.apply(ctx, [profilingMiddleMessage, socket]);
                        }
                    }));

                    //计算完毕或者异常请况下的退出
                    cps.on('exit', signal => {
                        if (Number(signal) === 0) dbl.debug(`tcp.profiler calculate success with exit code ${signal}!`);
                        else {
                            dbl.error(`tcp.profiler calculate failed with exit code ${signal}!`);
                            reject(`calculate failed with exit code ${signal}`);
                        }
                    });
                });
            } else {
                //执行分析操作
                analysis = yield common.profiler.analyticsP.apply(ctx, [data.opt, profiler, {
                    start: Date.now(),
                    middle: Date.now(),
                    /**
                     * @param {string} msg @param {number} time @param {boolean} end
                     * @description 生成回调 callback 所需参数
                     */
                    params: function (msg, time, end) {
                        const duration = common.utils.formatTime(time - (!end && this.middle || this.start));
                        const message = common.socket.composeMessage('req', 4, { sequence: ++sequence.seq, raw, loadingMsg: `${msg.prefix || '未知操作'}, 耗时 ${duration}${msg.suffix && `, ${msg.suffix}` || ''}...` });
                        this.middle = time;
                        return { message, socket };
                    },
                    callback: common.socket.notifySide.bind(ctx)
                }]);
            }

            //发送分析数据操作结束
            const analysisEndMessage = common.socket.composeMessage('req', 4, { sequence: ++sequence.seq, raw, loadingMsg: config.profiler[data.opt].end_analysis(analysis) });
            yield common.socket.notifySide.apply(ctx, [analysisEndMessage, socket]);

            //重置标记位，并返回成功响应给客户端
            doingProfiling[data.opt] = false;
            return common.socket.composeMessage('res', 3, { sequence: ++sequence.seq, raw, result: analysis });
        }
    }
}