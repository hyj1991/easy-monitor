'use strict';
const co = require('co');
//组装 key 的分隔符
const cache = {};

module.exports = function (_common, config, logger, utils) {
    /**
     * @param {object{function}} storage 
     * @description 资源锁简单实现，公共方法
     */
    function lockUtil(storage) {
        return {
            /**
             * @param {string} suffix
             * @description 获取资源锁，设置了 2s 的默认超时，以防止资源死锁
             */
            lockP(suffix) {
                return co(_lockG, suffix);
                function* _lockG(suffix) {
                    return yield storage.setP(`${config.cache.lock_prefix}${suffix}`, Date.now(), 'EX', config.cache.lock_timeout, 'NX');
                }
            },

            /**
             * @param {string} suffix
             * @description 释放资源锁
             */
            unlockP(suffix) {
                return co(_unlockG, suffix);
                function* _unlockG(suffix) {
                    yield storage.delP(`${config.cache.lock_prefix}${suffix}`);
                }
            }
        }
    }


    /**
     * @description 初始化 common.cache
     */
    function initP() {
        //执行 cache 初始化操作
        return co(_initStorageG, config);

        /**
         * @param {object} config 
         * @description 内部方法，初始化 storage 节点相关信息
        */
        function* _initStorageG(config) {
            if (config.cluster && config.storage) {
                //cluster 集群部署，暂时仅支持第三方使用 redis 缓存
                if (config.storage.type !== 'redis') throw new Error('暂时仅支持 Redis!');

                //进行初始化数据和设置主进程相关信息
                const init = config.storage.init;
                const result = typeof init === 'function' && init(config, logger, utils) || false;
                if (!result) throw new Error('cluster 模式下, 必须提供 storage 节点以及对应的 init 函数!');
                config.storage.setP = result.setP;
                config.storage.getP = result.getP;
                config.storage.delP = result.delP;
                //设置锁相关操作
                config.storage.lockUtil = lockUtil(config.storage);

                //setnx 确定谁是主进程
                const key = `${config.cache.master}::${config.embrace.machine_unique_key}`;
                const master = Boolean(yield result.setP(key, process.pid, 'EX', config.cache.nx_timeout, 'NX'));

                //针对 master / not master 进行不同的统一前缀 key 处理
                if (master) config.cache.socket_list = `${config.cache.socket_list}${process.pid}`;
                else config.cache.socket_list = `${config.cache.socket_list}${yield result.getP(key)}`;
            }
        }
    }

    /**
     * @param {string} key @param {string | object} value
     * @param {string | boolean} type 存储的类型
     * @param {boolean} noconvert 是否不需要自动将对象转换为字符串
     * @description 缓存 key - value 键值对
     */
    function setP(key, value, type, noconvert) {
        return co(_setG, key, value, type, noconvert);

        /**
         * @param 参数说明和父函数一致
         * @description 内部方法，处理 setP 的逻辑
         */
        function* _setG(key, value, type, noconvert) {
            if (!noconvert) {
                value = typeof value === 'object' && JSON.stringify(value) || value;
            }
            // cluster 模式下采取第三方缓存机制
            if (config.cluster) {
                const storage = config.storage;
                const lockUtil = storage.lockUtil;
                if (type) {
                    const prefix = `SET_${type}`;
                    //首先获取当前资源锁，如果获取到，则进行设置操作
                    let lock = yield lockUtil.lockP(prefix);
                    if (lock) {
                        let oldCache = yield storage.getP(type);
                        if (oldCache) oldCache = utils.jsonParse(oldCache);
                        else oldCache = {};

                        //对于 socket 信息类型，仅仅保存一个空对象备用
                        oldCache[key] = type === config.cache.socket_list && { pid: process.pid } || value;
                        //存储后塞回缓存中
                        yield storage.setP(type, JSON.stringify(oldCache), 'EX', config.cache.ex_timeout);
                    } else {//获取不到锁，则在下一个 tick 继续尝试获取锁
                        process.nextTick(co.wrap(_setG), key, value, type, noconvert);
                        return;
                    }
                    //操作完成释放资源锁
                    lockUtil.unlockP(prefix);
                } else yield storage.setP(key, value, 'EX', config.cache.ex_timeout);
            } else {// 默认模式下简单缓存即可
                if (type) {
                    if (cache[type]) cache[type][key] = value;
                    else {
                        cache[type] = {};
                        cache[type][key] = value;
                    }
                } else cache[key] = value;
            }
        }

    }

    /**
     * @param {string} key
     * @description 从缓存中取出 key 对应的值
     */
    function getP(key, type) {
        return co(_getG, key, type);

        /**
         * @param 参数说明和父函数一致
         * @description 内部方法，处理 getP 的逻辑
         */
        function* _getG(key, type) {
            let result = {};

            // cluster 模式下采取第三方缓存机制
            if (config.cluster) {
                const storage = config.storage;
                if (type) {
                    result = yield storage.getP(type);
                    result = utils.jsonParse(result);
                    if (result) result = result[key];
                } else {
                    result = yield storage.getP(key);
                    result = utils.jsonParse(result);
                };
            } else {// 默认模式下简单缓存即可
                if (type) result = cache[type][key];
                else result = cache[key];
            }

            return result;
        }
    }

    /**
     * @param {string} key
     * @description 从缓存中删除 key 对应的值
     */
    function delP(key, type) {
        return co(_delG, key, type);

        /**
         * @param 参数说明和父函数一致
         * @description 内部方法，处理 delP 的逻辑
         */
        function* _delG(key, type) {
            // cluster 模式下采取第三方缓存机制
            if (config.cluster) {
                const storage = config.storage;
                const lockUtil = storage.lockUtil;
                if (type) {
                    const prefix = `DEL_${type}`;
                    //首先获取当前资源锁，如果获取到，则进行删除操作
                    let lock = yield lockUtil.lockP(prefix);
                    if (lock) {
                        let oldCache = yield storage.getP(type);
                        if (oldCache) {
                            oldCache = utils.jsonParse(oldCache);
                            delete oldCache[key];
                            yield storage.setP(type, JSON.stringify(oldCache), 'EX', config.cache.ex_timeout);
                        }
                    } else {//获取不到锁则在下一个 tick 尝试再次获取
                        process.nextTick(co.wrap(_delG), key, type);
                        return;
                    }
                    //操作完成释放资源锁
                    lockUtil.unlockP(prefix);
                } else yield storage.delP(key);
            } else {// 默认模式下简单缓存即可
                //如果存在 type，则根据 type 删除对应的 key
                if (type) delete cache[type][key]
                else delete cache[key];
                resolve('success');
            }
        }
    }

    /**
     * @param {string | object} options
     * @description 生成特殊 key 的公共方法
     */
    function composeKey(options) {
        if (typeof options === 'string') return options;
        return JSON.stringify(options);
    }

    /**
     * @param {string} key
     * @description 将 composeKey 生成的 key 还原到原始对象
     */
    function decodeKey(key) {
        return utils.jsonParse(key);
    }

    return { storage: { setP, getP, delP }, composeKey, decodeKey, initP };
};