'use strict';
const assert = require('assert');
const path = require('path');
const rootPath = path.join(__dirname, '../../src_logic');
const _common = require(path.join(rootPath, 'common/common'));

describe('动态获取更改配置测试', () => {
    let common = null;
    let config = null;
    let fetch = null;
    before(() => {
        common = _common({ pre: ['config', 'logger', 'utils', 'cache'] });
        config = common.config;
        fetch = common.fetch;
    });

    it('获取当前配置，应该获取成功', () => {
        const result = {};
        fetch.getConfig(result, { name: 'test' });
        assert(JSON.stringify(result) !== '{}');
    });

    it('修改当前配置，应该修改成功', () => {
        const dbl = { setLevel: new Function() };
        const newConfig = {
            logger: { log_level: 'error' },
            profiler: { mode: 1 },
            cpu: {
                need_filter: false,
                profiling_time: 6 * 1000,
                timeout: 6,
                long_limit: 6,
                top_limit: 6,
                bail_limit: 6
            },
            memory: {
                need_root: false,
                leakpoint_limit: 10,
                node_limit: 10,
                distance_root_limit: 10,
                distance_limit: 10
            },
            name: 'test',
            auth: {
                admin: ['test'],
                project_auth: []
            }
        }
        const result = {};
        fetch.modifyConfig(newConfig, dbl, result);
        assert(config.logger.log_level === 'error');
        assert(config.profiler.mode === 1);
    });

    it('合并 dashbord 参数，应该合并成功', () => {
        const r1 = fetch.dashboardConfigMerge({});
        const r2 = fetch.dashboardConfigMerge(null, {});
        assert(Boolean(r1) === false);
        assert(Boolean(r2) === false);

        //cluster 模式下参数合并
        config.cluster = true;
        const r3 = fetch.dashboardConfigMerge({ auth: {} }, { name: 'test' });
        assert(JSON.stringify(r3) !== JSON.stringify({ auth: {} }));
    });
});