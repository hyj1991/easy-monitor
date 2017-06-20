'use strict';
const co = require('co');

module.exports = function (server) {
    //取出公共对象
    const common = this.common;
    const config = this.config;
    const dbl = this.dbl;
    const controller = this.controller;
    const cacheUtils = common.cache;

    const authType = config.message && config.message.request && config.message.request[8];

    /**
     * @param {socket} socket @param {string} data
     * @description 默认模式下进行用户鉴权操作请求
     */
    controller[authType] = function (socket, data) {
        return co(_start, socket, data);

        /**
         * @param {socket} socket @param {string} data
         * @description 内部方法，具体处理鉴权逻辑
         */
        function* _start(socket, data) {
            //获取数据
            data = common.utils.jsonParse(data);
            const messageId = data.messageId;
            const user = data.user;
            const pass = data.pass;

            //取出开发者注入的鉴权函数
            const authentication = config.auth.authentication;
            const isAuthed = typeof authentication === 'function' && (yield authentication(user, pass)) || false;

            //发送给 dashboard
            return common.socket.composeMessage('res', 9, { messageId, isAuthed });
        }
    }
}