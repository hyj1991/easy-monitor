'use strict';
const assert = require('assert');
const path = require('path');
const rootPath = path.join(__dirname, '../../src_logic');
const _common = require(path.join(rootPath, 'common/common'));

describe('加载 controller 测试', () => {
    let common = null;
    let config = null;
    let controller = null;
    before(() => {
        common = _common({ pre: ['config', 'logger', 'utils', 'cache'] });
        config = common.config;
        controller = common.controller;
    });

    it('加载 http & tcp 控制器文件，应该正确加载', () => {
        const cp = path.join(__dirname, '../resource');
        const app = { fake: true };
        try {
            controller.load('http', cp, app);
            controller.load('tcp', cp, app);
            assert(true);
        } catch (e) {
            console.error(e);
            assert(false);
        }
    });
});