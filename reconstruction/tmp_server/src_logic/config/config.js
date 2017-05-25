'use strict';

module.exports = {
    /**
     * @type {boolean} 值为 true 或者 false
     * @param true  仅启动 dashboard / embrace 进程
     * @param false 默认启动方式，dashboard 和 embrace 均启动
     * @description 是否采用集群部署的模式
     */
    cluster: false,

    /**
     * @type {string} 值为 "dashboard" 或者 "进程，embrace"
     * @param dashboard 仅启动 dashboard 进程
     * @param embrace 仅启动 embrace 进程
     * @description 仅在 cluster: true 下生效
     */
    bootstrap: 'dashboard',

    //用来处理子进程重启
    fork_restart: 'fork_node_restart',

    //压缩分隔符
    endSymbol: '!&@#$%\r\n',

    //项目名称 - 服务器信息 分隔符
    seg: "#-#"
}