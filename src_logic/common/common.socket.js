'use strict';
const co = require('co');

module.exports = function (_common, config, logger, utils, cache) {
    /**
     * @param {string} type @param {number} id @param {object | string} data
     * @return {object}
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
        if (type === 'oth') {
            message.type = 'other';
            message.msgType = config.message && config.message.other[id] || config.message.not_exist;
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
        return co(_sendMessage, client, message).catch(err => logger.error(`common.socket->sendMessage error: ${err}`));

        /**
         * @param {socket} client @param {string | object} message
         * @description 内部方法，使用 generator 来优化异步处理逻辑
         */
        function* _sendMessage(client, message) {
            message = typeof message === 'object' && JSON.stringify(message) || message;
            const compressBuffer = yield utils.compressMsg(message);
            let endSymBuf = null;
            try {
                //大于 Node v4 的版本采用更安全的 Buffer.from
                endSymBuf = Buffer.from(config.end_symbol);
            } catch (e) {
                //针对 Node v4 做的 pollyfill
                endSymBuf = new Buffer(config.end_symbol);
            }
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
        const common = ctx.common;
        const controller = ctx.controller;

        //对接收到的 buffer 流数据进行处理
        chunkInfo.chunks.push(chunk);
        chunkInfo.size += chunk.length;
        const tmp = Buffer.concat(chunkInfo.chunks, chunkInfo.size);
        let endSymBuf = null;
        try {
            //大于 Node v4 的版本采用更安全的 Buffer.from
            endSymBuf = Buffer.from(config.end_symbol);
        } catch (e) {
            //针对 Node v4 做的 pollyfill
            endSymBuf = new Buffer(config.end_symbol);
        }
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
                    const returnMsg = typeof fn === 'function' && fn(socket, item.data) || false;
                    //如果 controller 返回的值是 promise，则调用 then 后再返回
                    if (common.utils.isPromise(returnMsg)) {
                        returnMsg.then(r => r && common.socket.sendMessage(socket, r)).catch(e => dbl.error(`common.socket->onData error: ${e.stack}`));
                        return;
                    }
                    //普通对象或者字符串直接调用返回数据方法将处理数据返回给请求方
                    if (returnMsg) {
                        common.socket.sendMessage(socket, returnMsg);
                    }
                }
            });
        }
    }

    /**
     * @param {object} params 
     * @description 用于组装 socket 的 key
     */
    function composeKey(params) {
        const key = {
            pid: params.pid,
            name: params.name,
            server: params.server,
        }

        return JSON.stringify(key);
    }

    /**
     * @param {string | object} message @param {socket} socket 
     * @description 针对是否 cluster 以及定制了私有协议，采用不同方式上报数据
     */
    function notifySide(message, socket) {
        //cluster 模式下如果定制了私有协议，则采用私有通信方式
        if (config.cluster && config.private) {
            const fn = config.private.send;
            const p = typeof fn === 'function' && fn.apply(this, [message, socket]);
            socket[config.private.send_key] = true;
            return p;
        } else { return sendMessage(socket, message) }
    }

    return { composeMessage, sendMessage, onData, composeKey, notifySide }
}