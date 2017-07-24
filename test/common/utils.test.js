'use strict';
const assert = require('assert');
const path = require('path');
const rootPath = path.join(__dirname, '../../src_logic');
const _common = require(path.join(rootPath, 'common/common'));

describe('UTILS 模块测试', () => {
    let common = null;
    let config = null;
    let utils = null;
    before(() => {
        common = _common({ pre: ['config', 'logger', 'utils', 'cache'] });
        config = common.config;
        utils = common.utils;
    });

    it('子进程开启，应该建立子进程成功', function* () {
        const cpath = path.join(__dirname, '../resource/fork.js');
        const cps = utils.forkNode(cpath, [JSON.stringify({ test: 'test' })]);
        const exitCode = yield new Promise(resolve => cps.on('exit', resolve));
        assert(Number(exitCode) === 0);
    });

    it('解析 JSON字符串，合法的应该解析成功，不合法的应该能捕获到', () => {
        const legalJson = JSON.stringify({ test: 'test' });
        assert(utils.jsonParse(legalJson).test === 'test');
        common.logger.setLevel(-1);
        const illegalJson = 'test';
        assert(JSON.stringify(utils.jsonParse(illegalJson)) === '{}');
        assert(JSON.stringify(utils.jsonParse('')) === '{}');
        common.logger.setLevel(3);
    });

    it('检查当前 Node 版本，如果当前版本大于等于 v6.4.0，应该返回 true', () => {
        assert(utils.checkNodeVersion('6.4.0', '6.9.1') === true);
        assert(utils.checkNodeVersion('6.4.0', '6.4.0') === true);
        assert(utils.checkNodeVersion('6.4.0', '4.4.2') === false);
    });

    it('使用 zlib 压缩数据，应该压缩成功', function* () {
        try {
            yield utils.compressMsg('test');
            assert(true);
        } catch (e) {
            console.error(e);
            assert(false);
        }
    });

    it('根据结束符分割 buffer，应该分割成功', function* () {
        const compressBuffer = yield utils.compressMsg('test');
        let endSymBuf = null;
        try {
            //大于 Node v4 的版本采用更安全的 Buffer.from
            endSymBuf = Buffer.from(config.end_symbol);
        } catch (e) {
            //针对 Node v4 做的 pollyfill
            endSymBuf = new Buffer(config.end_symbol);
        }
        const newBuf = Buffer.concat([compressBuffer, endSymBuf], compressBuffer.length + endSymBuf.length);
        //测试分割
        const tmpArr = utils.bufferSplit(newBuf, endSymBuf);
        assert(utils.parseMessage(tmpArr[0]) === 'test');
    });

    it('初始化 common 模块带有 initP 方法，应该初始化成功', function* () {
        try {
            utils.commonInitP(common);
            assert(true);
        } catch (e) {
            console.error(e);
            assert(false);
        }
    });

    it('格式化 ms 时间，应该格式化成功', () => {
        assert(utils.formatTime(1e2) === '100.00 ms');
        assert(utils.formatTime(1e3 * 59) === '59.00 s');
        assert(utils.formatTime(1e3 * 60 * 59) === '59.00 min');
        assert(utils.formatTime(1e3 * 60 * 60 * 59) === '59.00 h');
        assert(utils.formatTime(1e3 * 60 * 60 * 60) === '216000000.00 ms');
        assert(utils.formatTime('test') === '0.00 ms');
    });
});