'use strict';
const assert = require('assert');
const path = require('path');
const rootPath = path.join(__dirname, '../../src_logic');
const _common = require(path.join(rootPath, 'common/common'));

describe('开启第三方缓存-缓存模块测试', () => {
    let common = null;
    let config = null;
    let cache = null;
    before(() => {
        common = _common({ pre: ['config', 'logger', 'utils', 'cache'] });
        config = common.config;
        cache = common.cache;

        //设置模式为cluster
        config.cluster = true;
        //构造第三方缓存 mock
        config.storage = {
            type: 'redis',
            init: function (config, logger, utils) {
                const Event = require('events').EventEmitter;
                const event = new Event();
                const cache = {};

                return {
                    sub: (topic, cb) => event.on(topic, cb),
                    pub: (topic, message) => event.emit(topic, message),
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
    });

    it('初始化 cache 模块，设置 storage 节点为 memcache，应该返回失败', function* () {
        try {
            common.config.storage.type = 'memcache';
            yield cache.initP();
            //开启第三方缓存情况下初始化
            assert(true);
        } catch (e) {
            assert(e.message === '暂时仅支持 Redis!');
        }
    });

    it('初始化 cache 模块, 应该成功', function* () {
        try {
            common.config.storage.type = 'redis';
            yield cache.initP();
            yield common.utils.cacheProcessInfoP.call({ common, config, dbl: { error: new Function(), debug: new Function() } });
            //开启第三方缓存情况下初始化
            assert(true);
        } catch (e) {
            console.error(e);
            assert(false);
        }
    });

    it('Set、Get、Del 功能，应该成功', function* () {
        const storage = cache.storage;
        try {
            //简单缓存测试
            yield storage.setP('key1', 'value1');
            const v1 = yield storage.getP('key1');
            assert(v1 === 'value1');
            yield storage.delP('key1');
            const v1n = yield storage.getP('key1');
            assert(Boolean(v1n) === false);

            //统一 key 缓存测试
            yield storage.setP('key2', 'value2', 'type2', true);
            yield storage.setP('key3', 'value3', 'type2', true, true);
            yield storage.setP('key4', { test: 'value4' }, 'type2');
            yield storage.setP('key5', 'value5', common.config.cache.socket_list)
            const v2 = yield storage.getP('key2', 'type2');
            assert(v2 === 'value2');
            const v3 = yield storage.getP('key3', 'type2', true);
            assert(v3 === 'value3');
            const v4 = yield storage.getP('key4', 'type2');
            assert(v4 === JSON.stringify({ test: 'value4' }));
            const v5 = yield storage.getP('key5', common.config.cache.socket_list);
            assert(typeof v5 === 'object');
            yield storage.delP('key2', 'type2');
            const v2n = yield storage.getP('key2', 'type2');
            assert(Boolean(v2n) === false);
        } catch (e) {
            console.error(e)
            assert(false);
        }
    });
});