'use strict';
const assert = require('assert');
const path = require('path');
const rootPath = path.join(__dirname, '../../src_logic');
const _common = require(path.join(rootPath, 'common/common'));

describe('内部加载模块测试', () => {
    let common = null;
    let config = null;
    let _require = null;
    before(() => {
        common = _common({ pre: ['config', 'logger', 'utils', 'cache'] });
        config = common.config;
        _require = common.require;
    });

    it('按项目路径加载文件，应该加载成功', () => {
        const m = _require('common/common.utils.js');
        assert(m);
    });
});