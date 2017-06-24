'use strict';

module.exports = {
    /**
     * @type {boolean} 值为 true 或者 false
     * @param true  仅启动 dashboard / embrace 进程
     * @param false 默认启动方式，dashboard 和 embrace 均启动
     * @description 是否采用集群部署的模式
     */
    cluster: false,

    //永远不允许动态更改运行模式
    cluster_disable: true,

    /**
     * @type {string} 值为 "dashboard" 或者 "进程，embrace"
     * @param dashboard 仅启动 dashboard 进程
     * @param embrace 仅启动 embrace 进程
     * @description 仅在 cluster: true 下生效
     */
    bootstrap: 'dashboard',

    //用来处理子进程重启
    fork_restart: 'fork_node_restart',

    //是否需要开启 Document
    need_document: false,

    //进程信息分隔符
    process_seg: '::',

    //压缩分隔符
    end_symbol: '!&@#$%\r\n',

    //项目名称 - 服务器信息 分隔符
    seg: "#-#",

    //tcp 客户端心跳间隔
    tcp_heartbeat: 60 * 1000,

    //tcp 客户端重启间隔时长
    reconnect_time: 1000,

    //tcp 客户端断链重连次数到达限后，发布重新建立子进程的事件
    reconnect_limit: 10
}