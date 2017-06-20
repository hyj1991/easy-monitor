'use strict';
const os = require('os');
const co = require('co');

module.exports = function (app) {
    //取出公共对象
    const common = this.common;
    const config = this.config;
    const dbl = this.dbl;
    const cacheUtils = common.cache;
    const httpUtils = common.http;

    /**
     * @param {object} progress @param {object} params
     * @description 通知子进程开始进行对应的操作，注意，此函数必须实现跨平台！
     * @description common, config
    */
    function* notifyProcess(progress, params) {
        //设置一些公用遍历方法
        const socketUtils = common.socket;
        //获取 socket信息
        const key = common.socket.composeKey(progress);
        const socket = yield cacheUtils.storage.getP(key, config.cache.socket_list);
        if (!socket) return false;
        //组装发送给客户端的信息
        const message = socketUtils.composeMessage('req', 6, params);

        //针对开启缓存和没有开启缓存模式进行分别处理
        if (cacheUtils.thirdCache()) {
            const channel = common.mq.composeChannel(config.mq.process_key, socket);
            common.mq.publish(channel, { key, msg: message });
        } else {
            //非 cluster 模式下，直接采用 tcp 下放数据
            const ctx = { common, config, dbl };
            yield common.socket.notifySide.apply(ctx, [message, socket]);
        }

        return true;
    }

    /**
     * @description 用于处理获取当前指定进程的概览信息
     */
    function* axiosOverview(req, res, next) {
        const body = req.body;
        const data = body && body.data;
        dbl.debug(`http.axios.overview receive data: ${JSON.stringify(data)}`);

        //body 为空返回错误
        if (!data) res.send(httpUtils.composeMessage(1));

        //通知对应的业务进程，上报 os 信息
        const progress = { name: data.name, server: data.server, pid: data.pid };
        const r = yield notifyProcess(progress, { opt: data.opt, raw: progress });
        if (!r) return res.send(httpUtils.composeMessage(4));

        //根据 key 获取数据
        const key = common.overview.composeKey(data);
        const result = yield cacheUtils.storage.getP(key, config.cache.opt_list);

        //有数据则返回正确信息，无数据则返回对应的错误
        if (!result) res.send(httpUtils.composeMessage(5));
        else res.send(httpUtils.composeMessage(0, result));
    }

    //以下是此 controller 文件注册的路由
    app.post(`${config.http.prefix}/${config.http.router.axios_overview}`, co.wrap(axiosOverview));
}