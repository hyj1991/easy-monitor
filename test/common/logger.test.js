'use strict';
const assert = require('assert');
const path = require('path');
const rootPath = path.join(__dirname, '../../src_logic');
const _common = require(path.join(rootPath, 'common/common'));

describe('日志测试', () => {
    let common = null;
    let config = null;
    let logger = null;
    before(() => {
        common = _common({ pre: ['config', 'logger', 'utils', 'cache'] });
        config = common.config;
        logger = common.logger;
    });

    it('重新设置日志级别，应该设置成功', () => {
        logger.setLevel(false);
        assert(Number(logger.level === 2));
        logger.setLevel(3);
        assert(Number(logger.level === 3));
    });

    it('设置日志前缀，应该设置成功', () => {
        logger.addPrefix('test');
        assert(logger.prefix === '[Easy-Monitor] test');
    });

    it('输出 Error、Warn、Info、Debug 级别日志，应该输出成功', () => {
        try {
            logger.error('output test');
            logger.warn('output test');
            logger.info('output test');
            logger.debug('output test');
            assert(true);
        } catch (e) {
            console.error(e);
            assert(false);
        }
    });
});