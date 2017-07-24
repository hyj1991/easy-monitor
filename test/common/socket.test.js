'use strict';
const assert = require('assert');
const path = require('path');
const rootPath = path.join(__dirname, '../../src_logic');
const _common = require(path.join(rootPath, 'common/common'));

describe('测试 socket 通信模块', () => {
    let common = null;
    let config = null;
    let socket = null;
    before(() => {
        common = _common({ pre: ['config', 'logger', 'utils', 'cache'] });
        config = common.config;
        socket = common.socket;
    });

    it('组装 Message，应该组装成功', () => {
        const key1 = socket.composeMessage('req', 0, 'test');
        const key2 = socket.composeMessage('res', 1, { test: 'test' });
        const key3 = socket.composeMessage('oth', 1, { test: 'test' });

        const key4 = socket.composeMessage('req', 100, 'test');
        const key5 = socket.composeMessage('res', 101, { test: 'test' });
        const key6 = socket.composeMessage('oth', 101, { test: 'test' });

        assert(key1);
        assert(key2);
        assert(key3);
        assert(key4);
        assert(key5);
        assert(key6);
    });

    it('组装 Key，应该组装成功', () => {
        const key = socket.composeKey({
            pid: 'test',
            name: 'test',
            server: 'test'
        });

        assert(key);
    });

    it('发送数据，应该发送成功', function* () {
        const message = socket.composeMessage('req', 0, 'test');
        const socketFake = { write: new Function() };
        try {
            yield socket.sendMessage(socketFake, message);
            yield socket.notifySide(message, socketFake);

            //测试 cluster 并且开启私有通信模式下
            config.cluster = true;
            config.private = { send() { return Promise.resolve() } };
            yield socket.notifySide(message, socketFake);
            assert(true);
        } catch (e) {
            console.error(e);
            assert(false);
        }
    });

    it('接收数据，应该接收成功', function* () {
        try {
            const socketFake = { write: new Function() };
            const ctx = {
                chunkInfo: { chunks: [], size: 0 },
                dbl: { error: new Function(), debug: new Function() },
                common, controller: {
                    test: function () { return 'test' },
                    testP: function () { return Promise.resolve('test') }
                }
            };
            //测试发送第一部分数据
            socket.onData.apply(ctx, [socketFake, yield common.utils.compressMsg(JSON.stringify({ msgType: 'test' }))]);
            //测试发送结束符
            let endSymBuf = null;
            try {
                //大于 Node v4 的版本采用更安全的 Buffer.from
                endSymBuf = Buffer.from(config.end_symbol);
            } catch (e) {
                //针对 Node v4 做的 pollyfill
                endSymBuf = new Buffer(config.end_symbol);
            }
            socket.onData.apply(ctx, [socketFake, endSymBuf]);

            //测试 controller 函数返回 promise
            socket.onData.apply(ctx, [socketFake, yield common.utils.compressMsg(JSON.stringify({ msgType: 'testP' }))]);
            socket.onData.apply(ctx, [socketFake, endSymBuf]);
            assert(true);
        } catch (e) {
            console.error(e);
            assert(false);
        }
    });
});