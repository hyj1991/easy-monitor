'use strict';
const co = require('co');
const cbs = {};

module.exports = function (_common, config, logger, utils) {
    //mq 仅在 cluster 模式下生效
    if (!config.cluster || !config.storage) return null;

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
                typeof cb === 'function' && cb(null, message);
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
     * @param {string} type
     * @description 根据 type 字段生成对应的 channel
     */
    function composeChannel(type) {
        let channel = '';
        if (type === config.mq.process_key) {
            channel = `${config.embrace.machine_unique_key}::${process.pid}`;
        }
        return channel;
    }

    return { initP, subscribe, composeChannel }
}
