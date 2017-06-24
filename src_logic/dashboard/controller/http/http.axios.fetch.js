'use strict';
const co = require('co');

module.exports = function (app) {
    //取出公共对象
    const common = this.common;
    const config = this.config;
    const dbl = this.dbl;
    const cacheUtils = common.cache;
    const httpUtils = common.http;
    const socketUtils = common.socket;

    /**
     * @description 对当注册项目的配置项目进行操作
     */
    function* axiosFetch(req, res, next) {
        try {
            dbl.debug(`http.axios.fetch-> axiosFetch receive data: ${JSON.stringify(req.body)}`);
            const data = req.body && req.body.data || {};
            const name = req.query.name;
            if (!name) {
                return res.send(httpUtils.composeMessage(1));
            }
            //设置用户名
            data.user = req.__user__;

            //根据操作的不同获取不同的数据
            let processObject = yield cacheUtils.storage.getP(config.cache.socket_list);
            processObject = typeof processObject === 'object' && processObject || common.utils.jsonParse(processObject);

            //没有进程返回错误信息
            if (!processObject) return res.send(httpUtils.composeMessage(4));
            const processInfoList = Object.keys(processObject);
            const projectProcessList = processInfoList.filter(process => {
                const tmp = common.utils.jsonParse(process);
                return Boolean(tmp.name === name);
            });
            const socketList = [];
            //get 随机选择该项目下的某一个进程
            if (data.type === 'get') {
                socketList.push(processObject[projectProcessList[Date.now() % projectProcessList.length]]);
            }
            //modify 通知所有进程
            if (data.type === 'modify') {
                //先对 dashboard 进程进行配置更改
                common.fetch.modifyConfig(data, dbl);
                //通知该项目下的所有进程
                projectProcessList.forEach(key => socketList.push(processObject[key]));
            }

            const notifyListP = [];
            const eventListP = [];
            for (let i = 0, l = socketList.length; i < l; i++) {
                //组装发送给客户端的信息，生成唯一的记录 ID
                const messageId = `${(new Date() - 0)}_${Math.random().toString(16).substr(2, 8)}`;
                const message = socketUtils.composeMessage('req', 10, { messageId, raw: data });
                //此处注意要兼容 cluser 和默认模式，故不能直接采用 socketUtils.sendMessage
                notifyListP.push(socketUtils.notifySide(message, socketList[i]));
                //侦听响应
                eventListP.push(new Promise(resolve => {
                    common.utils.event.on(messageId, response => {
                        resolve(response);
                    });
                    //设置超时时间，防止卡死在这里
                    setTimeout(resolve, config.http.timeout);
                }));
            }

            //并发通知
            yield notifyListP;
            //并发事件监听获取数据
            let result = {};
            const response = yield eventListP;
            if (data.type === 'get') {
                result = response[0];
                common.fetch.dashboardConfigMerge(result, data);
            } else {
                result = response;
            }

            //返回响应给客户端
            res.send(httpUtils.composeMessage(0, result));
        } catch (e) {
            dbl.error(`http.axios.fetch-> axiosFetch error: ${e}`);
            return res.send(httpUtils.composeMessage(3));
        }
    }

    //以下是此 controller 文件注册的路由
    app.post(`${config.http.prefix}/${config.http.router.axios_fetch}`, co.wrap(axiosFetch));
}