'use strict';
const lodash = require('lodash');
const child_process = require('child_process');
const EventEmitter = require('events').EventEmitter;
const event = new EventEmitter();

module.exports = function (_common, config, logger) {

    /**
     * @param {string | object} options 
     * @return {object}
     * @description 对用户传入参数进行合并
     */
    function merge(options) {
        //传入参数为字符串，则认为是项目名称
        if (typeof options === 'string') {
            config.title = options;
        }

        //传入参数为对象，则和原始参数进行合并操作
        if (typeof options === 'object') {
            lodash.merge(config, options);
        }

        return config;
    }

    /**
     * @param {string} forkPath 
     * @description 启动子进程
     */
    function forkNode(forkPath) {
        const dashboard = child_process.fork(forkPath);
        //侦听到 'exit' 事件则输出日志后退出
        dashboard.on('exit', signal => {
            if (signal === 0) {
                logger.info(`child_process [${dashboard.pid}] exit with code ${signal}...`);
            } else {
                logger.error(`child_process [${dashboard.pid}] exit with code ${signal}...`);
            }
            dashboard.kill();
        });

        //侦听到配置的 fork_restart 事件，则重新生成子进程
        event.on(config.fork_restart, forkNode.bind(forkPath));
    }

    return { event, merge, forkNode }
}