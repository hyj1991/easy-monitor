'use strict';
exports = module.exports = {
    cache: {
        //缓存 socket 信息列表的前缀 key
        socket_list: 'SOCKET_LIST_',

        //setnx - 确定主进程
        master: 'IS_MASTER',

        //竞态锁前缀
        lock_prefix: 'LOCK_PREFIS_',

        /**
         * @type {number} 单位 s
         * @description setnx - master key 超时时长，根据项目启动状况进行适当修改
         */
        nx_timeout: 10,

        /**
         * @type {number} 单位 s
         * @description setex 超时时长
         */
        ex_timeout: 10 * 60,

        /**
         * @type {number} 单位 s
         * @description 防止死锁，资源锁默认超时
         */
        lock_timeout: 2
    },
}