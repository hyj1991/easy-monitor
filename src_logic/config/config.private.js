'use strict';

module.exports = {
    /**
     * @description 配置私有通信定制化样例
     * @description 客户端和服务器均采用 http 通信，通过长轮询设计实现 server push
     */

    /** 以下是在 cluster 模式下给 dashboard 开启第三方缓存以支持集群部署样例 */
    /**
     * @param {string} type 缓存类型，暂时仅支持 redis
     * @param {object} redis redis 的地址配置项相关
     * @param {function} init 初始化构造函数，需要返回 setP, getP, delP 三个 Promise 方法 
     * @description cluster 模式下开启第三方缓存样例
     */
    /*storage: {
        type: "redis",

        redis: {
            host: '127.0.0.1',
            port: 6379
        },

        init: function (config, logger, utils) {
            const Redis = require('ioredis');
            const redisAddr = config.storage.redis;
            const redis = new Redis(redisAddr.port, redisAddr.host);
            //增加 pub / sub 消息队列
            const subscribe = new Redis(redisAddr.port, redisAddr.host);
            const publish = new Redis(redisAddr.port, redisAddr.host);
            return {
                sub: subscribe,
                pub: publish,
                setP: redis.set.bind(redis),
                getP: redis.get.bind(redis),
                delP: redis.del.bind(redis)
            }
        }
    },*/

    /** 以下是 cluster 模式下用私有协议替换默认的 tcp 通信协议的 dashboard 部分配置样例，以应对部分公司不支持 tcp 转发的特殊情况 */
    /**
     * @param {function} send 服务器向客户端发送消息方法，必须实现
     * @param {function} server 建立服务器方法，必须实现，返回服务器句柄
     * @param {number} polling_time @param {string} send_key 可选，用于私有服务器的相关配置（如果你实现的私有服务器无需则可以忽略
     * @description dashboard 中 private 节点会创建私有服务器替代默认的 tcp 通信服务器
     */
    /*private: {
        polling_time: 60 * 1000,

        send_key: "IS_SENDED",

        send(msg, res) {
            //取出公共部分
            const config = this.config;
            const common = this.common;
            const dbl = this.dbl;
            const cacheUtils = common.cache;

            //已经使用过的 res 句柄，放弃返回
            if (res[config.private.send_key]) return Promise.resolve('The socket has sended!');

            msg = typeof msg === 'object' && JSON.stringify(msg) || msg;
            res.send(msg);
            return Promise.resolve('success');
        },

        server: function () {
            //取出公共部分
            const config = this.config;
            const common = this.common;
            const dbl = this.dbl;
            const cacheUtils = common.cache;
            const controller = this.controller || {};

            //构造 http 服务器
            const express = require('express');
            const app = express();
            const bodyParser = require('body-parser');

            //加载中间件
            app.use(bodyParser.json({ limit: '50mb' }));
            app.use(bodyParser.urlencoded({ extended: false, limit: '10mb' }));


            //设置简易路由
            app.post('/', (req, res, next) => {
                let data = req.body.data;
                dbl.debug(`private_server receive data: ${data}`);
                data = common.utils.jsonParse(data);

                res.on('close', () => {
                    dbl.debug(`private_client closed, info is: ${res.__key__}`);
                    cacheUtils.storage.delP(res.__key__, config.cache.socket_list);
                    cacheUtils.storage.delP(res.__key__, config.cache.socket_list, true);
                });

                res.on('finish', () => {
                    dbl.debug(`private_client finish, info is: ${res.__key__}`);
                    //cacheUtils.storage.delP(res.__key__, config.cache.socket_list);
                });

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
                        //已经使用过的 res 句柄，放弃返回
                        if (res[config.private.send_key]) return;

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
        }
    },*/

    /**
     * @param {string} server_private 私有服务器侦听 ip，此参数暂时不生效，暂留待用
     * @param {number} port_private 私有服务器侦听端口
     * @description 配置私有 dashboard 服务器侦听地址和端口信息
     */
    /*dashboard: {
        server_private: '127.0.0.1',
        port_private: 26666
    },*/

    /** 以下是 cluster 模式下用私有协议替换默认的 tcp 通信协议的 embrace 部分配置样例，以应对部分公司不支持 tcp 转发的特殊情况 */
    /**
     * @param {function} send 客户端向服务器发送消息方法，必须实现
     * @param {function} client 客户端向服务器心跳方法，以及处理了服务器给客户端的响应，必须实现
     * @description embrace 中 private 节点会创建私有客户端代替默认的 tcp 通信方案
     */
    /*private: {
        send(msg) {
            const request = require('request');

            //取出公共部分
            const config = this.config;
            const common = this.common;
            const dbl = this.dbl;

            msg = typeof msg === 'object' && JSON.stringify(msg) || msg;

            return new Promise((resolve, reject) => {
                request.post({
                    url: `${config.embrace.url_private}`,
                    form: { data: msg }
                }, function (err, res, data) {
                    if (err) {
                        dbl.error(`private->send error: ${err}`);
                        return reject(err);
                    }
                    dbl.debug(`private->send statusCode: ${res.statusCode} receive data: ${data}`);
                    resolve('success');
                });
            });
        },

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
                request.post({
                    url: `${config.embrace.url_private}`,
                    form: { data: msg }
                },
                    function (err, res, data) {
                        if (err || (res && Number(res.statusCode !== 200))) {
                            //如果链接有错误，则 1s 后再次发送心跳包
                            dbl.error(`send msg: ${msg} error: ${err}`);
                            return setTimeout(_send, config.reconnect_time, msg);
                        }
                        dbl.debug(`private->_send msg: ${msg} statusCode: ${res.statusCode} receive data: ${data}`);
                        data = utils.jsonParse(data);

                        //这表示响应，偶数是请求，仅有请求或者心跳包响应才重新发送心跳包
                        if (data.id && (data.id % 2 === 0) || Number(data.id) === 1) {
                            //立即返回一个心跳包请求给服务器
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
    },*/

    /**
     * @param {string} url_private 私有客户端向私有服务器通信地址
     * @description 配置私有 embrace 客户端连接服务器地址和端口信息
     */
    /*embrace: {
        url_private: 'http://127.0.0.1:26666',
        // url_private: 'http://127.0.0.1:4006/em/',
    }*/
}