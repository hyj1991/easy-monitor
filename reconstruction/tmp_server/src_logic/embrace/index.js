'use strict';

module.exports.start = function (config, common) {
    const _require = common.require;

    //为 dashboard 新建一个不同前缀的 logger
    const Logger = common.logger.Logger;
    const logLevel = config.logger && config.logger.log_level || 2;
    const dbl = new Logger(logLevel, '[Easy-Monitor: embrace] ');

    //启动 tcp 客户端
    _require('embrace/dispatch')(config, common, dbl);
}