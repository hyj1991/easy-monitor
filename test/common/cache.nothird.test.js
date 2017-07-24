'use strict';
const assert = require('assert');
const path = require('path');
const rootPath = path.join(__dirname, '../../src_logic');
const _common = require(path.join(rootPath, 'common/common'));

describe('不开启第三方缓存-缓存模块测试', () => {
    let common = null;
    let config = null;
    let cache = null;
    before(() => {
        common = _common({ pre: ['config', 'logger', 'utils', 'cache'] });
        config = common.config;
        cache = common.cache;
    });

    it('初始化 cache 模块, 应该成功', function* () {
        try {
            yield cache.initP();
            yield common.utils.cacheProcessInfoP.call({ common, config, dbl: { error: new Function(), debug: new Function() } });
            //开启第三方缓存情况下初始化
            assert(true);
        } catch (e) {
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
            yield storage.setP('key2', 'value2', 'type2');
            yield storage.setP('key3', 'value3', 'type2');
            const v2 = yield storage.getP('key2', 'type2');
            assert(v2 === 'value2');
            const v3 = yield storage.getP('key3', 'type2');
            assert(v3 === 'value3');
            yield storage.delP('key2', 'type2');
            const v2n = yield storage.getP('key2', 'type2');
            assert(Boolean(v2n) === false);
        } catch (e) {
            console.error(e)
            assert(false);
        }
    });

    it('组装缓存 key 样例 {k1: v1, k2: v2}，应该返回 "{k1: v1, k2: v2}"', () => {
        try {
            cache.decodeKey(JSON.stringify({ 'k1': 'v1', 'k2': 'v2' }));
            assert(cache.composeKey('test') === 'test');
            assert(cache.composeKey({ 'k1': 'v1', 'k2': 'v2' }) === JSON.stringify({ 'k1': 'v1', 'k2': 'v2' }));
        } catch (e) {
            console.error(e);
            assert(false);
        }
    });

    it('传入 force 参数，认为不开启第三方缓存', () => {
        assert(cache.thirdCache(true) === false);
    });

    it('未传入 force 参数，且在 cluster 模式下，存在 storage 节点，认为开启第三方缓存', () => {
        const config = common.config;
        config.cluster = true;
        config.storage = {};
        assert(cache.thirdCache() === true);
    });
});