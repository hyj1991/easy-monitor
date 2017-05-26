'use strict';
const co = require('co');

module.exports = function (_common, config, logger, utils) {
    /**
     * @param {string} type @param {number} id @param {object | string} data
     * @description 组装发送信息
     */
    function composeMessage(type, id, data) {
        const message = { id };
        //根据类型选择消息的 type 字段值
        if (type === 'req') {
            message.type = 'request';
            message.msgType = config.message && config.message.request[id] || config.message.not_exist;
        }
        if (type === 'res') {
            message.type = 'response';
            message.msgType = config.message && config.message.response[id] || config.message.not_exist;
        }
        //设置数据区
        data = typeof data === 'object' && JSON.stringify(data) || data;
        message.data = data;

        return message;
    }

    /**
     * @param {socket} client @param {string | object} message
     * @description 发送 tcp 信息的统一处理函数，进行 zlib 压缩后再次发送
     */
    function sendMessage(client, message) {
        co(_sendMessage, client, message).catch(err => logger.error(`common.socket->sendMessage error: ${err}`));

        /**
         * @param {socket} client @param {string | object} message
         * @description 内部方法，使用 generator 来优化异步处理逻辑
         */
        function* _sendMessage(client, message) {
            message = typeof message === 'object' && JSON.stringify(message) || message;
            const compressBuffer = yield utils.compressMsg(message);
            const endSymBuf = Buffer.from(config.end_symbol);
            const newBuf = Buffer.concat([compressBuffer, endSymBuf], compressBuffer.length + endSymBuf.length);
            client.write(newBuf);
        }
    }

    /**
     * @param {socket} socket @param {buffer} chunk
     * @description tcp 句柄处理 data 事件
     */
    function onData(socket, chunk) {
        //获取一些公共信息
        const ctx = this;
        const chunkInfo = ctx.chunkInfo;
        const dbl = ctx.dbl;
        const controller = ctx.controller;

        //对接收到的 buffer 流数据进行处理
        chunkInfo.chunks.push(chunk);
        chunkInfo.size += chunk.length;
        const tmp = Buffer.concat(chunkInfo.chunks, chunkInfo.size);
        const endSymBuf = Buffer.from(config.end_symbol);
        if (~tmp.indexOf(endSymBuf)) {
            //调用 bufferSplit 方法，对临时生成的 buffer 进行分割
            let tmpArr = utils.bufferSplit(tmp, endSymBuf);
            let last = tmpArr.pop();

            //分割数据的方式，把尾部数据挂载到下一次拼接
            chunkInfo.chunks = [last];
            chunkInfo.size = last.length;

            //处理业务数据
            tmpArr.forEach(item => {
                item = utils.parseMessage(item);
                dbl.debug(`parse data: ${item}`);
                item = utils.jsonParse(item);

                //通过 id 找出对应的 controller
                const ctrlKey = item.msgType;
                if (controller[ctrlKey]) {
                    const fn = controller[ctrlKey];
                    typeof fn === 'function' && fn(socket, item.data);
                }
            });
        }
    }

    return { composeMessage, sendMessage, onData }
}