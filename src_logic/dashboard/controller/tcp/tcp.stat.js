'use strict';
const co = require('co');

module.exports = function (server) {
    //取出公共对象
    const common = this.common;
    const config = this.config;
    const dbl = this.dbl;
    const controller = this.controller;
    const cacheUtils = common.cache;

    //取出 profiling stat 操作的类型，并且设置对应的处理函数
    const profilerStatType = config.message && config.message.request && config.message.request[4];

    /**
     * @param {socket} socket @param {string} data
     * @description 给 tcp 请求设置回调函数，本回调函数处理 profiling 过程中状态上报
     */
    controller[profilerStatType] = function (socket, data) {
        return co(_stat, socket, data);

        /**
         * @param {socket} socket @param {string} data
         * @description 内部方法，处理具体的 profiling 状态上报逻辑
         */
        function* _stat(socket, data) {
            data = typeof data === 'object' && data || common.utils.jsonParse(data);

            const loadingMsg = data.loadingMsg;
            const raw = data.raw;
            const error = data.error;

            //根据原始参数组装出 key
            const key = common.profiler.composeKey(raw);

            //从缓存中取出原始数据
            let oldData = yield cacheUtils.storage.getP(key, config.cache.opt_list);
            //数据尚未初始化完毕
            if (!oldData) {
                oldData = {
                    done: false,
                    results: common.profiler.template({
                        pid: raw.pid,
                        name: raw.name,
                        unique: config.embrace.machine_unique_key
                    }, config.profiler[raw.opt].init())
                }
            }
            oldData = typeof oldData === 'object' && oldData || common.utils.jsonParse(oldData);

            //进行数据更新
            if (oldData.results && oldData.results.loadingMsg) {
                oldData.results.sequence = data.sequence;
                oldData.results.loadingMsg = loadingMsg;
            }

            //如果有错误设置错误
            if (error) {
                oldData.done = true;
                oldData.error = error;
            }

            //更新完毕后的数据重新塞进缓存
            yield cacheUtils.storage.setP(`${key}${data.sequence}`, oldData, config.cache.opt_list);

            //返回成功响应给客户端
            return common.socket.composeMessage('res', 5, {});
        }
    }
}