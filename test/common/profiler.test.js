'use strict';
const assert = require('assert');
const path = require('path');
const rootPath = path.join(__dirname, '../../src_logic');
const _common = require(path.join(rootPath, 'common/common'));

describe('性能分析模块测试', () => {
    let common = null;
    let config = null;
    let profiler = null;
    before(() => {
        common = _common({ pre: ['config', 'logger', 'utils', 'cache'] });
        config = common.config;
        profiler = common.profiler;
    });

    it('组装 key，应该组装成功', () => {
        const key = profiler.composeKey({
            pid: 'test',
            opt: 'test',
            name: 'test',
            server: 'test',
        });

        assert(key);
    });

    it('生成数据模板，应该生成成功', () => {
        const tmp = profiler.template({
            unique: 'test',
            name: 'test',
            pid: 'test'
        }, 'test', {});

        assert(tmp);
    });

    it('获取 CPU & Memory 数据，并且进行解析，应该获取成功', function* () {
        const ctx = { config, common, dbl: { error: new Function(), debug: new Function() } };
        const params = {
            params: () => ({ message: 'test' }),
            callback: () => Promise.resolve()
        }

        //测试 CPU
        config.profiler.cpu.profiling_time = 100;
        const cpuProfiler = yield profiler.profilerP('cpu', {
            start: Date.now(),
            callback() { return Promise.resolve(); }
        }, false);
        const cpuResultProfiler = yield profiler.analyticsP.apply(ctx, ['cpu', cpuProfiler, {
            start: Date.now(),
            middle: Date.now(),
            params() { return { message: 'test' } },
            callback() { return Promise.resolve() }
        }]);
        assert(cpuResultProfiler);

        //测试 Memory
        const memProfiler1 = yield profiler.profilerP('mem', {
            start: Date.now(),
            callback() { return Promise.resolve(); }
        }, true);
        const memResultProfiler1 = yield profiler.analyticsP.apply(ctx, ['mem', memProfiler1, {
            start: Date.now(),
            middle: Date.now(),
            params() { return { message: 'test' } },
            callback() { return Promise.resolve() }
        }]);
        assert(memResultProfiler1);

        //不采用 stream，开启 root 节点
        config.profiler.mem.optional.need_root = true;
        const memProfiler2 = yield profiler.profilerP('mem', {
            start: Date.now(),
            callback() { return Promise.resolve(); }
        }, false);
        const memResultProfiler2 = yield profiler.analyticsP.apply(ctx, ['mem', memProfiler2, {
            start: Date.now(),
            middle: Date.now(),
            params() { return { message: 'test' } },
            callback() { return Promise.resolve() }
        }]);
        assert(memResultProfiler2);
    });
});