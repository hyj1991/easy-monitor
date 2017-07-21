'use strict';
const assert = require('assert');
const path = require('path');
const rootPath = path.join(__dirname, '../../src_logic');
const _common = require(path.join(rootPath, 'common/common'));

describe('http 状态码响应测试', () => {
    let config = null;
    before(() => {
        const common = _common({ pre: ['config', 'logger', 'utils', 'cache'] });
        config = common.config;
    });

    it('config.http[code] 为函数时，应该执行该函数，返回状态信息结果', () => {
        const http = config.http;
        const message = http[7];
        assert(typeof message === 'function');
        assert(message() === '用户 未知 对此项目无操作权限!');
        assert(message({ user: 'test' }) === '用户 test 对此项目无操作权限!');
    });
});