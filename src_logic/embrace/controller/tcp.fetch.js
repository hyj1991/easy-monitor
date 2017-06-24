'use strict';
const co = require('co');

module.exports = function (server) {
    //取出公共对象
    const common = this.common;
    const config = this.config;
    const dbl = this.dbl;
    const controller = this.controller;
    const cacheUtils = common.cache;

    const fetchType = config.message && config.message.request && config.message.request[10];

    /**
     * @param {socket} socket @param {string} data
     * @description 对当先项目的配置文件进行操作
     */
    controller[fetchType] = function (socket, data) {
        return co(_start, socket, data);

        /**
         * @param {socket} socket @param {string} data
         * @description 内部方法，具体处理动态操作配置文件逻辑
         */
        function* _start(socket, data) {
            //获取数据
            data = common.utils.jsonParse(data);
            const messageId = data.messageId;
            const raw = data.raw;

            //根据不同 type 进行相应的操作
            const result = { user: raw.user };
            if (raw.type === 'get') common.fetch.getConfig(result, raw);
            if (raw.type === 'modify') common.fetch.modifyConfig(raw, dbl, result);

            //发送给 dashboard
            return common.socket.composeMessage('res', 11, { messageId, result });
        }
    }
}