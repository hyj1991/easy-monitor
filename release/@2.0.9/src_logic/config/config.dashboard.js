'use strict';

exports = module.exports = {
    dashboard: {
        /**
         * @type {string}
         * @description 设置 dashboard http 服务器地址，一般都是 localhost 或者 127.0.0.1
         */
        server_http: '127.0.0.1',

        /**
         * @type {string}
         * @description 设置 dashboard http 服务器端口，可随意更改，注意本地端口冲突问题即可，默认为 12333
         */
        port_http: '12333',

        /**
         * @type {string}
         * @description 设置 dashboard tcp 服务器地址，一般都是 localhost 或者 127.0.0.1
         */
        server_tcp: '127.0.0.1',

        /**
         * @type {string}
         * @description 设置 dashboard tcp 服务器端口，可随意更改，注意本地端口冲突问题即可，默认为 12333
         */
        port_tcp: '26666',

        /**
         * @type {string}
         * @description 设置 dashboard 的 views 路径
         */
        views: null,

        /**
         * @type {string}
         * @description 设置 dashboard 的 public 路径
         */
        public: null,

        /**
         * @type {string}
         * @description 设置 dashboard 的 favicon 路径
         */
        favicon: null,
    }
}