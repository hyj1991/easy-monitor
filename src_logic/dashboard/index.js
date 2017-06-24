'use strict';
const co = require('co');

module.exports.start = function (config, common) {
    co(_inner, config, common).catch(e => common.logger.error(`dashboard->index error: ${e}`));

    /**
     * @param {object} config @param {object} common
     * @description 内部方法
     */
    function* _inner(config, common) {
        const _require = common.require;

        //根据配置文件获取 dashboard 的 http / tcp 服务器监听地址和端口
        const dServerHttp = config.dashboard && config.dashboard.server_http;
        const dPortHttp = config.dashboard && config.dashboard.port_http;
        const dServerTcp = config.dashboard && config.dashboard.server_tcp;
        const dPortTcp = config.dashboard && config.dashboard.port_tcp;

        //为 dashboard 新建一个不同前缀的 logger
        const Logger = common.logger.Logger;
        const logLevel = config.logger && config.logger.log_level;
        const dbl = new Logger(logLevel, `[Easy-Monitor: dashboard <${process.pid}>] `);

        //如果有消息队列，开启本进程的消息订阅
        const ctx = { config, common, dbl };
        common.mq && common.utils.startMq(common.mq, common.mq.cbs[config.mq.process_key].bind(ctx));

        //缓存进程信息
        yield common.utils.cacheProcessInfoP.call(ctx);

        //cluster 模式下取出服务句柄
        const dispatch = _require('dashboard/dispatch')(config, common, dbl);

        //启动 http 服务器
        const app = dispatch.http;
        //const httpServer = app.listen(dPortHttp, dServerHttp, dbl.info.bind(dbl, `http_server start at ${dPortHttp}...`));
        const httpServer = app.listen(dPortHttp, dbl.info.bind(dbl, `http_server start at ${dPortHttp}...`));
        //如果端口冲突，则输出日志后关闭
        httpServer.on('error', err => {
            dbl.info(`http server has been started, this [${process.pid}] will be closed...`);
            httpServer.close();
            process.exit(0);
        });

        //如果用户注入了私有服务器(仅在 cluster 模式下生效)
        if (config.cluster && dispatch.private) {
            const handle = dispatch.private;
            const dServerPrivate = config.dashboard && config.dashboard.server_private;
            const dPortPrivate = config.dashboard && config.dashboard.port_private;
            //const privateServer = handle.listen(dPortPrivate, dServerPrivate, dbl.info.bind(dbl, `private_server start at ${dPortPrivate}...`))
            const privateServer = handle.listen(dPortPrivate, dbl.info.bind(dbl, `private_server start at ${dPortPrivate}...`))
            return;
        }

        //启动 tcp 服务器
        const tcp = dispatch.tcp;
        //const tcpServer = tcp.listen(dPortTcp, dServerTcp, dbl.info.bind(dbl, `tcp_server start at ${dPortTcp}...`));
        const tcpServer = tcp.listen(dPortTcp, dbl.info.bind(dbl, `tcp_server start at ${dPortTcp}...`));
        //如果端口冲突，则输出日志后关闭
        tcpServer.on('error', err => {
            dbl.info(`tcp server has been started, this [${process.pid}] will be closed...`);
            tcpServer.close();
            process.exit(0);
        });
    }
}