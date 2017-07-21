'use strict';
const assert = require('assert');
const path = require('path');
const rootPath = path.join(__dirname, '../../src_logic');
const _common = require(path.join(rootPath, 'common/common'));

describe('加载 common & config 测试', () => {
    let common = null;
    before(() => {
        common = _common({ pre: ['config', 'logger', 'utils', 'cache'] });
        common = _common({ pre: ['config', 'logger', 'utils', 'cache'], param: { config: 'test' } });
        common = _common({ pre: ['config', 'logger', 'utils', 'cache'], param: { config: { 'log_level': 0 } } });
    });

    //测试 common 和 config 加载成功
    it('加载 common & config 应该成功', () => {
        assert(common);
        assert(common.config);
    });
});