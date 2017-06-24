'use strict';
exports = module.exports = {
    cache: {
        //缓存 socket 信息列表的前缀 key
        socket_list: 'SOCKET_LIST_',

        //缓存 dashboard 进程前缀
        dashboard_list: 'DASHBOARD_LIST_',

        //竞态锁前缀
        lock_prefix: 'LOCK_PREFIS_',

        //状态上报资源锁
        lock_stat_update: 'UPDATE_PROCESS_STAT',

        //缓存操作列表信息的前缀 key
        opt_list: 'OPTION_LIST_',

        //setnx - 确定主进程
        master: 'IS_MASTER_',

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