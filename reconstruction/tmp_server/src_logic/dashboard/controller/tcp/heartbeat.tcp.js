'use strict';

module.exports = function (server) {
    //取出公共对象
    const common = this.common;
    const config = this.config;
    const dbl = this.dbl;
    const controller = this.controller;

    //取出 heartheat 心跳操作的类型，并且设置对应的处理函数
    const heartbeatType = config.message && config.message.request && config.message.request[0];

    /**
     * @param {socket} socket @param {string} data
     * @description 给 tcp 请求设置回调函数，本回调函数处理心跳包
     */
    controller[heartbeatType] = function (socket, data) {
        data = common.utils.jsonParse(data);
        const processInfoList = data.pid && data.pid.split(config.process_seg);

        //返回 heartbeat 的成功响应给客户端
        common.socket.sendMessage(socket, common.socket.composeMessage('res', 1, {}));
    }

}