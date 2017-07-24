'use strict';
const assert = require('assert');
const path = require('path');
const rootPath = path.join(__dirname, '../../src_logic');
const _common = require(path.join(rootPath, 'common/common'));

describe('MQ 模块测试', () => {
    let common = null;
    let config = null;
    let mq = null;
    before(function* () {
        //构造第三方缓存 mock
        const userConfig = {
            cluster: true,
            storage: {
                type: 'redis',
                init: function (config, logger, utils) {
                    const Event = require('events').EventEmitter;
                    const event = new Event();
                    const cache = {};

                    return {
                        sub: { 'subscribe': (topic, cb) => event.on(topic, cb), 'on': (topic, cb) => event.on(topic, cb) },
                        pub: { 'publish': (topic, message) => event.emit(topic, message) },
                        setP: (key, value) => {
                            cache[key] = value;
                            return Promise.resolve(true);
                        },
                        getP: key => Promise.resolve(cache[key]),
                        delP: key => {
                            delete cache[key];
                            return Promise.resolve(true);
                        }
                    }
                }
            }
        }

        common = _common({ pre: ['config', 'logger', 'utils', 'cache'], param: { config: userConfig } });
        yield common.cache.initP();
        config = common.config;
        mq = common.mq;
    });

    it('初始化 mq 模块，应该初始化成功', function* () {
        config.storage.type = 'memcache';
        try {
            yield mq.initP();
            assert(false);
        } catch (e) {
            assert(e.message === '暂时仅支持 Redis!')
        }
        config.storage.type = 'redis';
        try {
            yield mq.initP();
            common.utils.startMq(mq, new Function());
            assert(true);
        } catch (e) {
            console.error(e);
            assert(false);
        }
    });

    it('订阅消息，应该订阅成功', function* () {
        try {
            mq.subscribe('t1', new Function());
            mq.subscribeOnce('t2', new Function());
            assert(true);
        } catch (e) {
            console.error(e);
            assert(false);
        }
    });

    it('发布消息，应该发布成功', function* () {
        try {
            mq.publish('t1');
            mq.publish('t2');
            mq.publish('message');
            assert(true);
        } catch (e) {
            console.error(e);
            assert(false);
        }
    });

    it('生成频道名称，应该生成成功', function* () {
        const c1 = mq.composeChannel(config.mq.process_key);
        const c2 = mq.composeChannel(config.mq.process_key, { server: 'test', pid: 'test' });
        assert(c1);
        assert(c2);
    });

    it('测试订阅函数回调，应该调用成功', function* () {
        const fn = mq.cbs[config.mq.process_key];
        const ctx = { common, config, dbl: { error: new Function(), debug: new Function() } }
        fn.apply(ctx, ['test error']);
        fn.apply(ctx, [null, mq.composeChannel(config.mq.process_key), '{}']);
        fn.apply(ctx, [null, mq.composeChannel(config.mq.process_key), JSON.stringify({ type: 'NOTIFY_UPDATE_CONFIG' })]);
        assert(true);
    });
});