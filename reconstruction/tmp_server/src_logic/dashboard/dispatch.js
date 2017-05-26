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
            // helper.deleteCacheSocket(socket.__pid__);
            //dbl.error(`tcpserver->end This Socket closed, pid is ${socket.__pid__}`);
        });
    });

    //加载 http 服务器相关路由
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
    app.set('views', path.join(__dirname, './view'));
    app.set('view engine', 'ejs');

    //设置使用到的中间件
    app.use(compression());
    app.use(express.static(path.join(__dirname, './public')));
    app.use(serverFavicon(path.join(__dirname, './public/favicon.ico')));
    app.use(bodyParser.json({ limit: '50mb' }));
    app.use(bodyParser.urlencoded({ extended: false, limit: '10mb' }));

    //加载 http 服务器相关路由
    const controllerPath = path.join(__dirname, './controller');
    const ctx = { config, common, dbl };
    common.controller.load.apply(ctx, ['http', controllerPath, app]);

    return app;
}

module.exports = function (config, common, dbl) {
    return {
        tcp: createTcpServer(config, common, dbl),
        http: createHttpServer(config, common, dbl)
    };
};