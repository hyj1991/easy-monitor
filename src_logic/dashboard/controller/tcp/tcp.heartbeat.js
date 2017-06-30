'use strict';

module.exports = function (server) {
    //取出公共对象
    const common = this.common;
    const config = this.config;
    const dbl = this.dbl;
    const controller = this.controller;
    const cacheUtils = common.cache;

    //取出 heartheat 心跳操作的类型，并且设置对应的处理函数
    const heartbeatType = config.message && config.message.request && config.message.request[0];

    /**
     * @param {socket} socket @param {string} data
     * @description 给 tcp 请求设置回调函数，本回调函数处理心跳包
     */
    controller[heartbeatType] = function (socket, data) {
        data = common.utils.jsonParse(data);
        const processInfoList = data.pid && data.pid.split(config.process_seg);

        //组装 socket 缓存 key
        const key = common.socket.composeKey({
            name: processInfoList[0],
            server: processInfoList[1],
            pid: processInfoList[2]
        });

        //缓存 socket 信息, 将 key 写入 socket 的 __key__ 属性
        cacheUtils.storage && cacheUtils.storage.setP(key, socket, config.cache.socket_list, true);
        //强制缓存一份数据至内存
        cacheUtils.storage && cacheUtils.storage.setP(key, socket, config.cache.socket_list, true, true);
        //给 socket 对象写入一些常用的值备用
        socket.__key__ = key;
        socket.__timestamp__ = Date.now();

        //返回 heartbeat 的成功响应给客户端
        return common.socket.composeMessage('res', 1, {});
    }
}