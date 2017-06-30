'use strict';
const co = require('co');

module.exports = function (app) {
    //取出公共对象
    const common = this.common;
    const config = this.config;
    const dbl = this.dbl;
    const cacheUtils = common.cache;

    /**
     * @description 用于处理获取首页 project - server - list 信息
     */
    function* axiosIndex(req, res, next) {
        //定义返回值
        const response = {
            success: true,
            data: {
                seg: config.seg,
                projectPidMap: {}
            }
        };

        //根据设置的 socket_list 值获取 socket 列表
        let processInfo = {};
        try {
            processInfo = yield cacheUtils.storage.getP(config.cache.socket_list);
            processInfo = typeof processInfo === 'object' && processInfo || common.utils.jsonParse(processInfo);
        } catch (err) {
            dbl.error(`controller.http.axios->index storage.getP(${config.cache.socket_list}) error: ${err}`);
            response.success = false;
        }

        //过滤掉因为异常掉线但是一直没去除的链接
        const processList = Object.keys(processInfo).filter(item => {
            const ts = processInfo[item].__timestamp__ || Date.now();
            const duration = Date.now() - ts;
            //预留 10s 操作空间
            const out = Boolean(duration < (config.tcp_heartbeat + 10 * 1000));
            !out && cacheUtils.storage.delP(item, config.cache.socket_list);

            return out;
        });

        //处理获取到的 socket 列表信息
        processList.forEach(item => {
            const keyObject = cacheUtils.decodeKey(item);
            const keyTmp = `${keyObject.name}${config.seg}${keyObject.server}`
            const projectPidMap = response.data.projectPidMap;
            if (projectPidMap[keyTmp]) {
                projectPidMap[keyTmp].list.push(keyObject.pid);
            } else {
                projectPidMap[keyTmp] = { list: [keyObject.pid], loading: 0 }
            }
        });

        res.send(JSON.stringify(response));
    }

    //以下是此 controller 文件注册的路由
    app.post(`${config.http.prefix}/${config.http.router.axios_index}`, co.wrap(axiosIndex));
}