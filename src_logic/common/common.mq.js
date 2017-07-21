'use strict';
const co = require('co');
const cbs = {};

module.exports = function (_common, config, logger, utils, cache) {
    //mq 仅在 cluster 模式下生效
    if (!cache.thirdCache()) return null;

    /**
     * @description 初始化 mq 队列
     */
    function initP() {
        //执行 mq 初始化操作
        return co(_initMqG, config);

        /**
         * @param {object} config
         * @description 内部方法，初始化 mq 的具体逻辑实现
         */
        function* _initMqG(config) {
            //cluster 集群部署，暂时仅支持第三方使用 redis 缓存
            if (config.storage.type !== 'redis') throw new Error('暂时仅支持 Redis!');
            //获取 storage 句柄
            const storage = config.storage;

            //订阅的服务，对回调事件进行处理
            storage.sub.on('message', function (channel, message) {
                logger.debug(`common.mq->subscribe receive message <${message}> from channel <${channel}>...`);

                //对于设置了 mq 回调函数的 channel，取出回调函数进行处理
                const cb = cbs[channel];
                typeof cb === 'function' && cb(null, channel, message);
            });
        }
    }

    /**
     * @param {array | string} topic
     * @param {function} cb
     * @description 订阅 topic, 用预设的回调函数进行处理
     */
    function subscribe(topic, cb) {
        topic = Array.isArray(topic) && topic || [topic];
        const storage = config.storage;

        //分别订阅设置的 topic
        topic.forEach(t => {
            storage.sub.subscribe(t, function (err, num) {
                if (err) return logger.error(`common.mq->subscribe topic <${t} error: ${err}>`);
                logger.debug(`common.mq->subscribe topic <${t}> success, and now subscribe ${num} channels...`);
            });

            //塞进去回调函数
            cbs[t] = cb;
        });
    }

    /**
     * @param {array | string} topic
     * @param {function} cb
     * @description 仅订阅一次 topic, 用预设的回调函数进行处理，用完销毁防止内存泄漏
     */
    function subscribeOnce(topic, cb) {
        subscribe(topic, function () {
            //执行原回调
            cb.apply(this, Array.from(arguments));
            //用完进行销毁操作
            cbs[topic] = null;
            delete cbs[topic];
        });
    }

    /**
     * @param {array | string} topic @param {object | string} message 
     */
    function publish(topic, message) {
        topic = Array.isArray(topic) && topic || [topic];
        const storage = config.storage;
        message = typeof message === 'object' && JSON.stringify(message) || message;

        //分别向对应的 channel 发送消息
        topic.forEach(t => {
            storage.pub.publish(t, message);
        });
    }

    /**
     * @param {string} type @param {object} params
     * @description 根据 type 字段生成对应的 channel
     */
    function composeChannel(type, params) {
        let channel = '';
        if (type === config.mq.process_key) {
            if (!params) channel = `${config.embrace.machine_unique_key}::${process.pid}`;
            else channel = `${params.server}::${params.pid}`;
        }
        return channel;
    }

    /**
     * @param {object} error @param {string} channel @param {string} message
     * @description 侦听本进程本身的消息队列回调函数
     */
    function processCallback(error, channel, message) {
        //取出公共部分
        const config = this.config;
        const common = this.common;
        const dbl = this.dbl;
        const cacheUtils = common.cache;

        //执行逻辑
        if (error) return dbl.error(`common.mq->processCallback error: ${error}`);
        co(_process, channel, message).catch(err => dbl.error(`common.mq->processCallback error: ${err}`));

        /**
         * @param {string} channel @param {string} message
         * @description 内部方法，具体处理 mq 消息队列的逻辑
         */
        function* _process(channel, message) {
            //记录一条 debug 日志信息
            dbl.debug(`common.mq->processCallback receive data: ${message}`);
            //字符串转换成 json 后取出缓存的 key 和 msg 信息
            message = common.utils.jsonParse(message);
            const type = message.type

            //无类型的默认处理
            if (!type) {
                const key = message.key;
                const msg = message.msg;

                //根据 key 获取 socket
                const socket = yield cacheUtils.storage.getP(key, config.cache.socket_list, true);
                if (!socket) return;
                //通知服务器
                const ctx = { config, common, dbl };
                yield common.socket.notifySide.apply(ctx, [msg, socket]);
                return;
            }

            //以下是有操作类型处理
            if (type === config.message.other[1]) {
                //处理 dashboard 进程本身的更新操作
                const data = message.msg && message.msg.data && common.utils.jsonParse(message.msg.data) || { data: {} };
                common.fetch.modifyConfig(data.data, dbl);
                return;
            }
        }
    }

    //设置 mq 队列的回调处理函数列表
    const builthinCallbacks = {};
    builthinCallbacks[config.mq.process_key] = processCallback;

    return { initP, subscribe, subscribeOnce, publish, composeChannel, cbs: builthinCallbacks }
}
