'use strict';
const assert = require('assert');
const path = require('path');
const rootPath = path.join(__dirname, '../../src_logic');
const _common = require(path.join(rootPath, 'common/common'));

describe('鉴权功能测试', () => {
    let config = null;
    before(() => {
        const common = _common({ pre: ['config', 'logger', 'utils', 'cache'] });
        config = common.config;
    });

    //测试 config.auth.need 为 true，但是开发者未传入自定义函数
    it('config.auth.need 为 true，但是开发者没有传入自定义鉴权函数，应该抛出错误', function* () {
        const authentication = config.auth.authentication;
        config.auth.need = true;
        try {
            const auth = yield authentication('test', 'test');
        } catch (e) {
            assert(e.message === 'auth.need 为 true 时请实现自己的 authentication 方法!');
        }
    });

    //测试 config.auth.need 为 false 情况下
    it('config.auth.need 为 false，应该通过鉴权', function* () {
        const authentication = config.auth.authentication;
        config.auth.need = false;
        const auth = yield authentication('test', 'test');
        assert(auth === true);
    });

    //测试 config.auth 节点不存在情况下
    it('config.auth 节点为空，应该通过鉴权', function* () {
        const authentication = config.auth.authentication;
        config.auth = null;
        const auth = yield authentication('test', 'test');
        assert(auth === true);
    });
});