'use strict';
const path = require('path');

module.exports = function (_common, config, logger, utils) {
    /**
     * @param {string} root 
     * @return {function}
     * @description 生成内部 require 方法，简便多层嵌套情况
    */
    function createRequire(root) {
        return function (filePath) {
            let res = {};
            try {
                logger.debug(`inner require file path is: ${filePath}`);
                res = require(path.join(root, filePath));
            } catch (e) { logger.error(`<${filePath}> load error: ${e}`) }

            return res;
        }
    }

    //根据配置文件提供的 src_root 设置项目根路径
    return createRequire(config.require && config.require.src_root)
};