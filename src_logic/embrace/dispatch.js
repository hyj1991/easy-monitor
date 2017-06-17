'use strict';
const path = require('path');
const net = require('net');

/**
 * @param {object} config @param {object} common @param {logger} dbl
 * @description 获取 embrace 客户端的 controller
 */
function createController(config, common, dbl) {
    const controller = {};
    const controllerPath = path.join(__dirname, './controller');
    const ctx = { config, common, dbl, controller };
    common.controller.load.apply(ctx, ['tcp', controllerPath]);
    return controller;
}

/**
 * @param {object} config @param {object} common @param {logger} dbl
 * @description 创建和 dashboard 通信的客户端
 */
function createTcpClient(config, common, dbl) {
    //获取公共方法，以及针对 tcp 链接的公共方法
    const controller = this.controller;
    const utils = common.utils;
    const socketUtils = common.socket;

    //和服务器建立链接，以及初始心跳包设置
    const client = new net.Socket();
    const heartBeatMessage = socketUtils.composeMessage('req', 0, {
        pid: `${config.project_name}${config.process_seg}${config.embrace.machine_unique_key}${config.process_seg}${process.pid}`
    });
    let reconnectTimes = 0;

    /**
     * @description 内部方法，建立 tcp 链接成功的回调（这里也是自己编写容易出现内存泄漏的重灾函数！）
     */
    function _callbackListener() {
        dbl.info(`connect to ${config.embrace.tcp_host}:${config.embrace.tcp_port} success...`);
        reconnectTimes = 0;
        socketUtils.sendMessage(client, heartBeatMessage);
    }

    /**
     * @description 内部方法，和 tcp 服务器进行连接
     */
    function _connect() {
        client.connect(config.embrace.tcp_port, config.embrace.tcp_host, _callbackListener);
    }

    //和服务器进行 tcp 连接，并且按照设置的心跳间隔和服务器进行保活
    _connect();
    setInterval(() => socketUtils.sendMessage(client, heartBeatMessage), config.tcp_heartbeat);

    //处理 tcp 数据
    const chunkInfo = { chunks: [], size: 0 };
    const ctx = { common, dbl, chunkInfo, controller };
    client.on('data', socketUtils.onData.bind(ctx, client));

    //处理客户端连接错误信息
    client.on('error', function (error) {
        dbl.debug(`tcpclient->pid ${process.pid} error: ${error}`);
    });

    //处理客户端断链事件
    client.on('close', function () {
        if (++reconnectTimes === config.reconnect_limit) {
            utils.event.emit(config.fork_restart);
            reconnectTimes = 0;
        }
        dbl.debug(`tcpclient->close pid ${process.pid}, tcp connection closed`);
        //这里不将 connect 事件监听器移除，则会隐式地产生内存泄漏的问题
        client.removeListener('connect', _callbackListener);
        client.destroy();
        setTimeout(_connect, config.reconnect_time);
    });
}

module.exports = {
    tcp: createTcpClient,
    controller: createController,
};