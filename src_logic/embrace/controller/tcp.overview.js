'use strict';
const co = require('co');
const lodash = require('lodash');

module.exports = function (server) {
    //取出公共对象
    const common = this.common;
    const config = this.config;
    const dbl = this.dbl;
    const controller = this.controller;
    const cacheUtils = common.cache;

    //标记位，防止重复劳动
    let osInfo = false;

    //取出开始 profiling 操作的类型，并且设置对应的处理函数
    const overviewType = config.message && config.message.request && config.message.request[6];

    /**
     * @param {socket} socket @param {string} data
     * @description 给 tcp 请求设置回调函数，本回调函数处理获取业务进程 os 信息操作
     */
    controller[overviewType] = function (socket, data) {
        return co(_start, socket, data);

        /**
         * @param {socket} socket @param {string} data
         * @description 内部方法，具体处理 os 信息获取逻辑
         */
        function* _start(socket, data) {
            //已经在执行了，返回
            if (osInfo) return;
            osInfo = true;
            //获取数据
            data = common.utils.jsonParse(data);
            const raw = lodash.merge({ opt: data.opt }, data.raw);

            //获取本进程的 cpu 使用率和 memory 占用信息
            const memoryUsage = common.overview.computeMemoryUsage();
            const cpuUsage = common.overview.computeCpuUsage();
            const result = { cpu: cpuUsage, mem: memoryUsage };

            //重置标记位
            osInfo = false;
            //发送给 dashboard
            return common.socket.composeMessage('res', 7, { raw, result });
        }
    }
}