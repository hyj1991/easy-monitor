'use strict';
const assert = require('assert');
const path = require('path');
const rootPath = path.join(__dirname, '../../src_logic');
const _common = require(path.join(rootPath, 'common/common'));

describe('加载 middleware 测试', () => {
    let common = null;
    let config = null;
    let middleware = null;
    before(() => {
        common = _common({ pre: ['config', 'logger', 'utils', 'cache'] });
        config = common.config;
        middleware = common.middleware;
    });

    it('加载 middleware 中间件文件，应该正确加载', () => {
        const cp = path.join(__dirname, '../resource');
        const app = { fake: true };
        try {
            middleware.load(cp, app);
            assert(true);
        } catch (e) {
            console.error(e);
            assert(false);
        }
    });
});