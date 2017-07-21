'use strict';
const assert = require('assert');
const path = require('path');
const rootPath = path.join(__dirname, '../../src_logic');
const _common = require(path.join(rootPath, 'common/common'));

describe('profiler 配置参数测试', () => {
    let config = null;
    before(() => {
        const common = _common({ pre: ['config', 'logger', 'utils', 'cache'] });
        config = common.config;
    });

    it('CPU & Memory 中间态输出，应该输出字符串', () => {
        ['cpu', 'mem'].forEach(opt => {
            //测试初始化
            assert(typeof config.profiler[opt].init() === 'string');
            //测试 profiling 开始
            if (opt === 'cpu') {
                config.profiler.cpu.profiling_time = 1e2;
                assert(typeof config.profiler[opt].start_profiling() === 'string');
                config.profiler.cpu.profiling_time = 1e3 * 59;
                assert(typeof config.profiler[opt].start_profiling() === 'string');
                config.profiler.cpu.profiling_time = 1e3 * 60 * 59;
                assert(typeof config.profiler[opt].start_profiling() === 'string');
                config.profiler.cpu.profiling_time = 1e3 * 60 * 60 * 59;
                assert(typeof config.profiler[opt].start_profiling() === 'string');
                config.profiler.cpu.profiling_time = 1e3 * 60 * 60 * 60;
                assert(typeof config.profiler[opt].start_profiling() === 'string');
                config.profiler.cpu.profiling_time = 'test';
                assert(typeof config.profiler[opt].start_profiling() === 'string');
                //剩余时间
                assert(typeof config.profiler[opt].start_profiling(5000) === 'string');
            } else {
                assert(typeof config.profiler[opt].start_profiling() === 'string');
            }
            //测试 profiling 结束
            if (opt === 'mem') {
                assert(typeof config.profiler[opt].end_profiling(null, true) === 'string');
            }
            config.profiler.mode = 0;
            assert(typeof config.profiler[opt].end_profiling() === 'string');
            config.profiler.mode = 1;
            assert(typeof config.profiler[opt].end_profiling() === 'string');
            //测试传送数据
            assert(typeof config.profiler[opt].end_analysis() === 'string');
            assert(typeof config.profiler[opt].end_analysis('test end_analysis') === 'string');
            assert(typeof config.profiler[opt].end_analysis({ test: 'test' }) === 'string');
            //测试结束
            assert(typeof config.profiler[opt].end('test end') === 'string');
        });
    });

    it('Memory 内存数据解析过滤，路径或者函数名称包含 node_modules 或者 anonymous 应该被过滤', () => {
        const filter_function = config.profiler.filter_function;
        //测试路径
        assert(filter_function('(/root/node_modules)', 'test') === false);
        assert(filter_function('(/root/anonymous)', 'test') === false);
        //测试函数名称
        assert(filter_function('(/root/html)', 'anonymous') === false);
    });

    it('Memory 内存数据解析过滤，路径不以 (/ 开始的应该被过滤', () => {
        const filter_function = config.profiler.filter_function;
        assert(filter_function('(idle)', 'idle') === false);
    });

    it('Memory 内存数据解析过滤，入参 [(/root/html), test] 正确，不应该被过滤', () => {
        const filter_function = config.profiler.filter_function;
        assert(filter_function.apply(null, ['(/root/html)', 'test']) === true);
    });
});