'use strict';
const os = require('os');

exports = module.exports = {
    embrace: {
        /**
         * @type {string}
         * @description 设置 embrace 的发送 tcp 数据服务器地址，cluster 模式下需要修改
         */
        tcp_host: '127.0.0.1',

        /**
         * @type {number}
         * @description 设置 embrace 的发送 tcp 数据服务器端口，根据项目需求可进行修改
         */
        tcp_port: 26666,

        /**
         * @type {string}
         * @description 设置机器唯一标识符，默认是 Hostname，考虑到 docker 部署下 hostname 会重复，所以允许注入
         */
        machine_unique_key: os.hostname()
    }
}