'use strict';
const assert = require('assert');
const path = require('path');
const rootPath = path.join(__dirname, '../../src_logic');
const _common = require(path.join(rootPath, 'common/common'));

describe('http 响应信息测试', () => {
    let common = null;
    let config = null;
    let http = null;
    before(() => {
        common = _common({ pre: ['config', 'logger', 'utils', 'cache'] });
        config = common.config;
        http = common.http;
    });

    it('组装 http 响应信息，应该组装成功', () => {
        const msg1 = http.composeMessage(0, { 'test': 'test' });
        const msg2 = http.composeMessage(0, 'test');
        const msg3 = http.composeMessage(1);
        const msg4 = http.composeMessage(7, { user: 'test' });
        const msg5 = http.composeMessage(999);

        assert(msg1);
        assert(msg2);
        assert(msg3);
        assert(msg4);
        assert(msg5);
    });
});