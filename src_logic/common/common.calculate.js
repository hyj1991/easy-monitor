'use strict';
const path = require('path');
const stream = require('stream');
const cp = require('child_process');

module.exports = function (_common, config, logger, utils) {
    /**
     * @param {object | string} msg 
     * @description 发送数据，进行一些预处理
     */
    function _innerSend(msg) {
        if (!msg) return;
        const vm = this;

        //对流式数据进行特殊处理
        if (msg instanceof stream.Stream) {
            msg.pipe(vm.stdin);
            return;
        }

        //其余数据直接发送
        vm.send(msg);
    }

    /**
     * @param {string} cpath @param {object | string} params 
     * @return {process}
     * @description fork 出计算进程
     */
    function fork(cpath, params) {
        //取出公共部分
        const config = this.config;
        const common = this.common;
        const dbl = this.dbl;

        //fork 进程，stdio 设置子进程的 stdin 为 pipe 备用传输数据，其余默认
        params = typeof params === 'string' && params || params && JSON.stringify(params) || '';
        const ps = cp.fork(cpath, [params], { stdio: ['pipe', 1, 2, 'ipc'] });
        //设置子进程内部方法
        ps.innerSend = _innerSend;

        return ps;
    }

    return { fork }
};