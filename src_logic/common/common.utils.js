'use strict';
const co = require('co');
const zlib = require('zlib');
const lodash = require('lodash');
const child_process = require('child_process');
const EventEmitter = require('events').EventEmitter;
const event = new EventEmitter();

module.exports = function (_common, config, logger) {
    /**
     * @param {string} forkPath 
     * @param {array} argv
     * @description 启动子进程
     */
    function forkNode(forkPath, argv) {
        /**
         * @description 在开启 inspect 或者 debug 模式下子进程自动失败
         * @description issue 地址: https://github.com/hyj1991/easy-monitor/issues/10
         */
        const dashboard = child_process.fork(forkPath, argv, { silent: false, execArgv: [] });
        //侦听到 'exit' 事件则输出日志后退出
        dashboard.on('exit', signal => {
            if (signal === 0) {
                logger.info(`child_process [${dashboard.pid}] exit with code ${signal}...`);
            } else {
                logger.error(`child_process [${dashboard.pid}] exit with code ${signal}...`);
            }
            dashboard.kill();
        });

        //侦听到配置的 fork_restart 事件，则重新生成子进程
        event.on(config.fork_restart, forkNode.bind(null, forkPath, argv));
        //返回句柄
        return dashboard;
    }

    /**
     * @param {string} str
     * @return {object}
     * @description 安全的 json 字符转换串操作
     */
    function jsonParse(str) {
        let result = {};
        if (!str) return result;
        try {
            result = JSON.parse(str);
        } catch (e) {
            logger.error(`common.utils->jsonParse error: ${e}, raw str is: ${str}`);
        }
        return result;
    }

    /**
     * @param {string} msg 
     * @return {promise}
     * @description 采用 node.js 自带的压缩模块对需要传输的数据进行压缩
     */
    function compressMsg(msg) {
        return new Promise((resolve, reject) => {
            zlib.deflate(msg, (err, buffer) => {
                if (err) return reject(err);
                return resolve(buffer);
            });
        });
    }

    /**
     * @param {buffer | string} buffer @param {buffer | string} endSymbol
     * @description 对 buffer 对象进行按照传入的结束符进行分割操作
     */
    function bufferSplit(buffer, endSymbol) {
        buffer = Buffer.isBuffer(buffer) && buffer || Buffer.from(buffer);
        endSymbol = Buffer.isBuffer(endSymbol) && endSymbol || Buffer.from(endSymbol);

        //初始化偏移量和存储结果的数组
        let offset = 0;
        let array = [];
        let symIndex = buffer.indexOf(endSymbol, offset);

        //从偏移量起始开始查询，如果依旧能查询到结束符的位置，则继续分割
        while (~symIndex) {
            array.push(buffer.slice(offset, symIndex));
            offset = symIndex + endSymbol.length;
            symIndex = buffer.indexOf(endSymbol, offset);
        }
        array.push(buffer.slice(offset));

        //返回结果数组
        return array;
    }

    /**
     * @param {buffer} msg
     * @description 将 zlib 压缩过的 buffer 解压为字符串
     */
    function parseMessage(msg) {
        msg = Buffer.isBuffer(msg) && msg || Buffer.from(msg);
        msg = zlib.inflateSync(msg);
        return String(msg);
    }

    /**
     * @param {any} obj
     * @description 判断传入的参数类型是否为 promise
     */
    function isPromise(obj) {
        obj = typeof obj === 'object' && obj || {};
        return typeof obj.then === 'function';
    }

    /**
     * @param {object} common
     * @description 对 common 列表中需要进行初始化操作的文件进行对应处理
     */
    function commonInitP(common) {
        return co(_init, common);

        /**
         * @param {object} common
         * @description 内部方法，进行具体初始化逻辑操作
         */
        function* _init(common) {
            const list = Object.keys(common);
            for (let i = 0, l = list.length; i < l; i++) {
                try {
                    const fn = common[list[i]] && common[list[i]].initP;
                    if (fn) yield fn();
                } catch (e) { logger.error(`common.utils->commonInitP <${list[i]}> error: ${e}`) }
            }
        }
    }

    /**
     * @param {object} mq @param {function} cb
     * @description 启动 mq 消息队列
     */
    function startMq(mq, cb) {
        if (!mq) return;
        const channel = mq.composeChannel(config.mq.process_key);
        mq.subscribe(channel, cb);
    }

    /**
     * @return {promise}
     * @description 将本 dashboard 部分缓存起来
     */
    function cacheProcessInfoP() {
        //取出公共部分
        const vm = this;
        const common = this.common;
        const config = this.config;
        const dbl = this.dbl;
        const cacheUtils = common.cache;

        return co(_cache);

        /**
         * @description 内部方法，实现具体的逻辑
         */
        function* _cache() {
            const thirdCache = cacheUtils.thirdCache();
            //这里存在资源同步操作的问题，需要手动添加锁
            if (thirdCache) {
                //获取锁公共方法
                const lockUtil = config.storage.lockUtil;
                //第三方缓存模式下需要加锁操作
                const prefix = `SET_PROCESS_INFO_${config.cache.dashboard_list}`;
                const lock = yield lockUtil.lockP(prefix);
                if (lock) {
                    //获取到锁则进行业务逻辑处理
                    yield _set();
                    //操作完成释放资源锁
                    yield lockUtil.unlockP(prefix);
                } else {
                    //否则下一个 tick 继续尝试
                    process.nextTick(cacheProcessInfoP.bind(vm))
                }
            } else {
                //非第三方缓存模式下直接填充
                yield _set();
            }
        }

        /**
         * @description 内部方法，设置进程信息
         */
        function* _set() {
            let data = yield cacheUtils.storage.getP(config.cache.dashboard_list);
            if (!data) data = '[]';
            data = jsonParse(data);
            if (!Array.isArray(data)) data = [];
            data.push({ pid: process.pid, server: config.embrace.machine_unique_key });
            yield cacheUtils.storage.setP(config.cache.dashboard_list, data);
        }
    }

    /**
     * @param {string} prefix @param {string} suffix
     * @description cache 配置文件中部分需要在 cluster 模式下重新生成的配置
     */
    function joinCacheKey(prefix, suffix) {
        if (!config.cache) return;
        config.cache[prefix] = `${config.cache[prefix]}${suffix}`;
    }

    /**
     * @param {number} ts
     * @return {string}
     * @description 对 ms 级别的时间进行格式化
     */
    function formatTime(ts) {
        ts = !isNaN(ts) && ts || 0;
        let str = '';
        if (ts < 1e3) {
            str = `${ts.toFixed(2)} ms`;
        } else if (ts < 1e3 * 60) {
            str = `${(ts / 1e3).toFixed(2)} s`;
        } else if (ts < 1e3 * 60 * 60) {
            str = `${(ts / (1e3 * 60)).toFixed(2)} min`;
        } else if (ts < 1e3 * 60 * 60 * 60) {
            str = `${(ts / (1e3 * 60 * 60)).toFixed(2)} h`;
        } else {
            str = `${ts.toFixed(2)} ms`;
        }

        return str;
    }

    /**
     * @param {string} target @param {string | undefined} now
     * @description 校验当前 node 版本 > target
     */
    function checkNodeVersion(target, now) {
        //不传入 target，认为正确
        if (!target) return true;
        now = now || process.versions.node;

        //两者恒等
        if (now === target) return true;

        //循环判断
        let result = false;
        let compare = [now, target];
        while (compare) {
            //分割数据
            const now = String(compare[0]).split('.');
            const tar = String(compare[1]).split('.');

            //比较首位
            const nowFirst = Number(now.shift());
            const tarFirst = Number(tar.shift());

            //仅当首位相等时需要循环
            result = Boolean(nowFirst > tarFirst);
            compare = nowFirst === tarFirst && [now.join('.'), tar.join('.')] || false;
        }

        return result;
    }

    return {
        event, forkNode, jsonParse, checkNodeVersion,
        compressMsg, bufferSplit, parseMessage, isPromise,
        commonInitP, startMq, joinCacheKey, formatTime, cacheProcessInfoP
    }
}