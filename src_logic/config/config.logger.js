'use strict';

exports = module.exports = {
    logger: {
        /**
         * @type {number} 值为 0，1，2 或者 3
         * @param 0 表示不输出任何日志
         * @param 1 表示输出 info 日志
         * @param 2 表示输出 error 日志
         * @param 3 表示输出 debug 日志
         * @description 设置日志级别
         */
        log_level: 2,

        //是否允许修改，默认允许修改
        disable: false
    },
}