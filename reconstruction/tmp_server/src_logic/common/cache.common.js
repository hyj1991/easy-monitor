'use strict';
//组装 key 的分隔符
const cache = {};

module.exports = function (_common, config, logger, utils) {

    /**
     * @param {string} key @param {string | object} value
     * @param {string | boolean} type 存储的类型
     * @param {boolean} noconvert 是否不需要自动将对象转换为字符串
     * @description 缓存 key - value 键值对
     */
    function setP(key, value, type, noconvert) {
        if (!noconvert) {
            value = typeof value === 'object' && JSON.stringify(value) || value;
        }

        return new Promise((resolve, reject) => {
            // cluster 模式下采取第三方缓存机制
            if (config.cluster) {

            } else {// 默认模式下简单缓存即可
                if (type) {
                    if (cache[type]) cache[type][key] = value;
                    else {
                        cache[type] = {};
                        cache[type][key] = value;
                    }
                } else cache[key] = value;

                resolve('success');
            }
        });
    }

    /**
     * @param {string} key
     * @description 从缓存中取出 key 对应的值
     */
    function getP(key, type) {
        return new Promise((resolve, reject) => {
            // cluster 模式下采取第三方缓存机制
            if (config.cluster) {

            } else {// 默认模式下简单缓存即可
                let result = {};
                if (type) result = cache[type][key];
                else result = cache[key];

                resolve(result);
            }
        });
    }

    /**
     * @param {string} key
     * @description 从缓存中删除 key 对应的值
     */
    function delP(key, type) {
        return new Promise((resolve, reject) => {
            // cluster 模式下采取第三方缓存机制
            if (config.cluster) {

            } else {// 默认模式下简单缓存即可
                //如果存在 type，则根据 type 删除对应的 key
                if (type) delete cache[type][key]
                else delete cache[key];
                resolve('success');
            }
        });
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

    return { storage: { setP, getP, delP }, composeKey, decodeKey };
};