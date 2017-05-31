'use strict';

module.exports = {
    /**
     * @description 配置私有通信定制化样例
     * @description 客户端和服务器均采用 http 通信，通过长轮询设计实现 server push
     */
    /*private: {
        //long polling 间隔时长
        polling_time: 5 * 1000,

        //私有服务器定制
        server: function () {
            //取出公共部分
            const config = this.config;
            const common = this.common;
            const dbl = this.dbl;
            const controller = this.controller || {};

            //构造 http 服务器
            const express = require('express');
            const app = express();

            //设置简易路由
            app.get('/', (req, res, next) => {
                let data = req.query.data;
                dbl.debug(`private_server receive data: ${data}`);
                data = common.utils.jsonParse(data);

                if (controller[data.msgType]) {
                    const fn = controller[data.msgType];
                    const returnMsg = typeof fn === 'function' && fn(res, data.data) || false;
                    //对心跳包进行特殊处理
                    if (Number(data.id) === 0) {
                        const pollingTimer = setTimeout(_sendResponse, config.private.polling_time, returnMsg);
                        return;
                    }
                    //其余请求立即返回
                    _sendResponse(returnMsg)

                    function _sendResponse(returnMsg) {
                        //如果 controller 返回的值是 promise，则调用 then 后再返回
                        if (common.utils.isPromise(returnMsg)) {
                            returnMsg.then(r => res.send(JSON.stringify(r)));
                            return;
                        }
                        //普通对象或者字符串直接调用返回数据方法将处理数据返回给请求方
                        if (returnMsg) {
                            res.send(JSON.stringify(returnMsg));
                        }
                    }
                }
            });

            return app;
        },

        //私有客户端定制
        client: function () {
            //取出公共部分
            const config = this.config;
            const common = this.common;
            const dbl = this.dbl;
            const controller = this.controller;

            //构造 http 客户端
            const request = require('request');
            const utils = common.utils;
            const socketUtils = common.socket;

            //定义心跳包
            const heartBeatMessage = socketUtils.composeMessage('req', 0, {
                pid: `${config.project_name}${config.process_seg}${config.embrace.machine_unique_key}${config.process_seg}${process.pid}`
            });

            //首次发送心跳包
            _send(heartBeatMessage);

            function _send(msg) {
                msg = typeof msg === 'object' && JSON.stringify(msg) || msg;
                request.get(`http://${config.embrace.server_private}:${config.embrace.port_private}/?data=${msg}`,
                    function (err, res, data) {
                        if (err) {
                            //如果链接有错误，则 1s 后再次发送心跳包
                            dbl.error(`send msg: ${msg} error: ${err}`);
                            return setTimeout(_send, 1000, msg);
                        }
                        dbl.debug(`receive data: ${data}`);
                        data = utils.jsonParse(data);
                        //对于心跳包请求做特殊处理, 立即返回一个请求给服务器
                        if (Number(data.id) === 1) {
                            _send(heartBeatMessage);
                        }

                        //处理真正的请求
                        if (controller[data.msgType]) {
                            const fn = controller[data.msgType];
                            const returnMsg = typeof fn === 'function' && fn(res, data.data) || false;
                            //如果 controller 返回的值是 promise，则调用 then 后再返回
                            if (common.utils.isPromise(returnMsg)) {
                                returnMsg.then(r => _send(JSON.stringify(r)));
                                return;
                            }
                            //普通对象或者字符串直接调用返回数据方法将处理数据返回给请求方
                            if (returnMsg) {
                                _send(JSON.stringify(returnMsg));
                            }
                        }
                    });
            }

        }
    },

    //配置私有 dashboard 服务器侦听地址和端口信息
    dashboard: {
        server_private: '127.0.0.1',
        port_private: 26666
    },

    //配置私有 embrace 客户端连接服务器地址和端口信息
    embrace: {
        server_private: '127.0.0.1',
        port_private: 26666
    }*/
}