'use strict';
const fs = require('fs');
const assert = require('assert');
const path = require('path');
const rootPath = path.join(__dirname, '../../src_logic');
const _common = require(path.join(rootPath, 'common/common'));

describe('计算子进程测试', () => {
    let common = null;
    let config = null;
    let calculate = null;
    before(() => {
        common = _common({ pre: ['config', 'logger', 'utils', 'cache'] });
        config = common.config;
        calculate = common.calculate;
    });

    it('Node 版本检测，v6.4.0 以上和以下均应该启动成功', function* () {
        const cpath = path.join(__dirname, '../resource/fork.js');

        //假设当前 node 版本小于 v6.4.0
        common.utils.checkNodeVersion = function () { return false };
        const params1 = { test: 'test' };
        const cps1 = calculate.fork(cpath, params1);
        yield cps1.innerSend('test');
        try {
            yield cps1.innerSend();
        } catch (e) {
            assert(e === 'msg could not be empty!');
        }
        yield new Promise(resolve => {
            cps1.on('message', msg => assert(msg === JSON.stringify(params1)));
            cps1.on('exit', code => {
                assert(Number(code) === 0);
                resolve();
            });
        });

        //假设当前 node 版本大于等于 v6.4.0
        common.utils.checkNodeVersion = function () { return true };
        const params2 = 'test';
        const cps2 = calculate.fork(cpath, params2);
        yield cps2.innerSend(fs.createReadStream(cpath));
        yield new Promise(resolve => {
            cps2.on('message', msg => assert(msg === params2));
            cps2.on('exit', code => {
                assert(Number(code) === 0);
                resolve();
            });
        });
    });
});