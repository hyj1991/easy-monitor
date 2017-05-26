'use strict';
const net = require('net');

module.exports = function (config, common, dbl) {
    //获取公共方法，以及针对 tcp 链接的公共方法
    const utils = common.utils;
    const socketUtils = common.socket;
    const controller = {};

    //和服务器建立链接，以及初始心跳包设置
    const client = new net.Socket();
    let heartBeatMessage = socketUtils.composeMessage('req', 0, {
        pid: `${config.project_name}${config.process_seg}${config.embrace.machineUniqueKey}${config.process_seg}${process.pid}`
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
        //when socket close, remove original listener to avoid memory leak
        client.removeListener('connect', _callbackListener);
        client.destroy();
        setTimeout(_connect, 200);
    });
};