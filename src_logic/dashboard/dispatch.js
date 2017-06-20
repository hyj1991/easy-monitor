'use strict';
const net = require('net');
const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const serverFavicon = require('serve-favicon');
const compression = require('compression');
const app = express();

/**
 * @param {object} config @param {object} common @param {logger} dbl
 * @description 生成 TCP 服务器，并且返回获得的服务器句柄 
 */
function createTcpServer(config, common, dbl) {
    const utils = common.utils;
    const socketUtils = common.socket;
    const cacheUtils = common.cache;
    const controller = {};
    //创建服务器
    const server = net.createServer(socket => {
        dbl.debug(`receive new socket from <${socket.remoteAddress}:${socket.remotePort}>`);

        //处理客户端连接发送的数据
        const chunkInfo = { chunks: [], size: 0 };
        const ctx = { common, dbl, chunkInfo, controller };
        socket.on('data', socketUtils.onData.bind(ctx, socket));

        //客户端连接的错误事件处理
        socket.on('error', err => {
            dbl.error(`tcpserver->error ${err}`);
        });

        //客户端连接的 socket end 事件处理
        socket.on('end', () => {
            //清除缓存中的数据
            cacheUtils.storage.delP(socket.__key__, config.cache.socket_list);
            //强制清除内存中的数据
            cacheUtils.storage.delP(socket.__key__, config.cache.socket_list, true);
            //输出错误日志
            dbl.error(`tcp_client socket closed, info is ${socket.__key__}`);
        });
    });

    //加载 tcp 服务器相关路由
    const controllerPath = path.join(__dirname, './controller');
    const ctx = { config, common, dbl, controller };
    common.controller.load.apply(ctx, ['tcp', controllerPath, server]);

    return server;
}

/**
 * @param {object} config @param {object} common @param {logger} dbl
 * @description 生成 HTTP 服务器，并且返回获得的服务器句柄 
 */
function createHttpServer(config, common, dbl) {
    //设置渲染相关参数
    app.set('views', config.dashboard.views || path.join(__dirname, './view'));
    app.set('view engine', 'ejs');

    //设置使用到的中间件
    app.use(compression());
    app.use(express.static(config.dashboard.public || path.join(__dirname, './public')));
    app.use(serverFavicon(config.dashboard.favicon || path.join(__dirname, './public/favicon.ico')));
    app.use(bodyParser.json({ limit: '50mb' }));
    app.use(bodyParser.urlencoded({ extended: false, limit: '10mb' }));

    //加载 http 服务器相关自定义中间件和路由
    const middlewarePath = path.join(__dirname, './middleware');
    const controllerPath = path.join(__dirname, './controller');
    const ctx = { config, common, dbl };
    common.middleware.load.apply(ctx, [middlewarePath, app]);
    common.controller.load.apply(ctx, ['http', controllerPath, app]);

    return app;
}

/**
 * @param {object} config @param {object} common @param {logger} dbl
 * @description 生成 private 服务器，并且返回获得的服务器句柄
 * @description 注意：此服务器作用是替代默认的 tcp 通信方案，用于一些特殊的场合
 */
function createPrivateServer(config, common, dbl) {
    //私有服务器仅在 cluster 模式下生效
    if (!config.cluster || config.bootstrap !== 'dashboard') return false;
    //如果用户没有传入 private 节点，则返回 false
    if (!config.private) return false;

    const privateServer = config.private.server;
    //config.private.server 节点必须是一个函数
    if (!typeof privateServer === 'function') return false;

    //加载 private 服务器相关路由
    const controller = {};
    const controllerPath = path.join(__dirname, './controller');
    const ctx = { config, common, dbl, controller };
    common.controller.load.apply(ctx, ['tcp', controllerPath]);

    //返回私有服务器句柄    
    const handle = privateServer.call(ctx);
    return handle;
}

module.exports = function (config, common, dbl) {
    return {
        tcp: createTcpServer(config, common, dbl),
        http: createHttpServer(config, common, dbl),
        private: createPrivateServer(config, common, dbl)
    };
};