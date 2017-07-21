'use strict';
const assert = require('assert');
const path = require('path');
const rootPath = path.join(__dirname, '../../src_logic');
const _common = require(path.join(rootPath, 'common/common'));

describe('计算 CPU 数据解析结果测试', () => {
    let common = null;
    let config = null;
    let performance = null;
    before(() => {
        common = _common({ pre: ['config', 'logger', 'utils', 'cache'] });
        config = common.config;
        performance = common.performance;
    });

    it('计算 CPU Profiler 数据，应该得到正确的结果', function* () {
        const cpu = path.join(__dirname, '../resource/cpu.json');
        const profiler = require(cpu);
        const params = {
            params: () => ({ message: 'test' }),
            callback: () => Promise.resolve()
        }
        const optional = config.profiler.cpu.optional;
        const timeout = params.timeout || optional.timeout;
        const limit = { long: params.long_limit || optional.long_limit, top: params.top_limit || optional.top_limit, bail: params.bail_limit || optional.bail_limit };
        const filter = config.profiler.need_filter && config.profiler.filter_function;
        const resultProfiler = yield performance.fetchCPUProfileP.apply({ params }, [profiler, timeout, limit, filter]);
        assert(resultProfiler);
    });
});