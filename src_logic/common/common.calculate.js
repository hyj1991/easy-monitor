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
        const vm = this;

        return new Promise((resolve, reject) => {
            if (!msg) return resolve('msg could not be empty!');
            //对流式数据进行特殊处理
            if (msg instanceof stream.Stream) {
                msg.pipe(vm.stdin);
                //end 时返回
                msg.on('end', resolve);
                //发生错误直接 reject
                vm.stdin.on('error', resolve);

                return;
            }

            //其余数据直接发送
            vm.send(msg, resolve);
        });
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
        let ps = null;

        /**
         * @description 在 Node v6.4.0 版本及以下版本使用开启子进程处理分析数据失败
         * @description issue 地址: https://github.com/hyj1991/easy-monitor/issues/17
         */
        if (utils.checkNodeVersion('6.4.0')) {
            ps = cp.fork(cpath, [params], { stdio: ['pipe', 1, 2, 'ipc'], silent: false, execArgv: ['--max_old_space_size=8192'] });
        } else {
            ps = cp.fork(cpath, [params], { silent: true, execArgv: ['--max_old_space_size=8192'] });
        }

        //设置子进程内部方法
        ps.innerSend = _innerSend;

        return ps;
    }

    return { fork }
};