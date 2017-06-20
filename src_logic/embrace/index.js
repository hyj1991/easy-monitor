'use strict';

module.exports.start = function (config, common) {
    const _require = common.require;

    //为 dashboard 新建一个不同前缀的 logger
    const Logger = common.logger.Logger;
    const logLevel = config.logger && config.logger.log_level;
    const dbl = new Logger(logLevel, `[Easy-Monitor: embrace <${process.pid}>] `);

    //获取 embrace 的 dispatch 信息
    const dispatch = _require('embrace/dispatch');
    const controller = dispatch.controller(config, common, dbl);

    //如果在 cluster 模式下，且 private 字段不为空，则启动私有客户端
    if (config.cluster && config.private && config.private.client) {
        const fn = config.private.client;
        typeof fn === 'function' && fn.call({ config, common, dbl, controller });
        return;
    }

    //启动 tcp 客户端
    const tcpClient = dispatch.tcp;
    tcpClient.apply({ controller }, [config, common, dbl]);
}