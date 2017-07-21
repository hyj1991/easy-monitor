'use strict';
const assert = require('assert');
const path = require('path');
const rootPath = path.join(__dirname, '../../src_logic');
const _common = require(path.join(rootPath, 'common/common'));

describe('概览信息数据测试', () => {
    let common = null;
    let config = null;
    let overview = null;
    before(() => {
        common = _common({ pre: ['config', 'logger', 'utils', 'cache'] });
        config = common.config;
        overview = common.overview;
    });

    it('计算 Memory & CPU 使用率', () => {
        try {
            overview.computeCpuUsage();
            overview.computeMemoryUsage();
            overview.composeKey({
                pid: 'test',
                opt: 'test',
                name: 'test',
                server: 'test',
            })
            assert(true);
        } catch (e) {
            console.error(e);
            assert(false);
        }
    });
});