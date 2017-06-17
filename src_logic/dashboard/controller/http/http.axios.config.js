'use strict';
const co = require('co');

module.exports = function (app) {
    //取出公共对象
    const common = this.common;
    const config = this.config;
    const dbl = this.dbl;
    const cacheUtils = common.cache;
    const httpUtils = common.http; 

    /**
     * @description 用于处理获取当前指定进程的概览信息
     */
    function* axiosConfig(req, res, next) {
        //直接将配置传给 view 层
        res.send(httpUtils.composeMessage(0, config));
    }

    //以下是此 controller 文件注册的路由
    app.get(`${config.http.prefix}/axiosConfig`, co.wrap(axiosConfig));
}