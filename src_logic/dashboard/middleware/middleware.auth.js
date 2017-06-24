'use strict';
const co = require('co');
const basicAuth = require('basic-auth');

module.exports = function (app) {
    //取出公共对象
    const config = this.config;
    const common = this.common;
    const dbl = this.dbl;
    const cacheUtils = common.cache;
    const socketUtils = common.socket;
    const httpUtils = common.http;

    /**
     * @param {request} req @param {response} res @param {function} next
     * @description 鉴权中间件
     */
    function* authentication(req, res, next) {
        try {
            const credentials = basicAuth(req);
            //无鉴权信息
            if (!credentials) {
                res.statusCode = 401;
                res.setHeader('WWW-Authenticate', 'Basic realm="Easy Monitor"');
                return res.send(httpUtils.composeMessage(6));
            }

            //根据运行是否为 cluster 做分别处理（默认模式下 dashboard 进程是 fork 出来的，无法传递函数）
            let isAuthed = false;
            if (config.cluster) {
                //取出开发者注入的鉴权函数
                const authentication = config.auth.authentication;
                isAuthed = yield authentication(credentials.name, credentials.pass);
            } else {
                //默认模式下找任意的一个业务进程即可
                const processObject = yield cacheUtils.storage.getP(config.cache.socket_list);
                //客户端尚未建立起连接直接允许通过
                if (!processObject) return next();

                //根据当前时间戳随机取出来一个业务进程 socket 句柄
                const list = Object.keys(processObject);
                const socket = processObject[list[Date.now() % list.length]];
                //组装发送给客户端的信息，生成唯一的记录 ID
                const messageId = `${(new Date() - 0)}_${Math.random().toString(16).substr(2, 8)}`;
                const message = socketUtils.composeMessage('req', 8, { messageId, user: credentials.name, pass: credentials.pass });
                yield socketUtils.sendMessage(socket, message);

                //等待响应
                isAuthed = yield new Promise(resolve => {
                    //客户端响应
                    if (cacheUtils.thirdCache()) {
                        //正常永远也不会走到这个分支，预留一下以防万一
                        common.mq.subscribeOnce(messageId, (error, channle, isAuthed) => {
                            resolve(isAuthed);
                        });
                    } else {
                        //这是正常情况下应该会走到的分支
                        common.utils.event.once(messageId, resolve);
                    }
                    //超时判定，防止永远卡在这里
                    setTimeout(resolve, config.auth.timeout);
                });
            }

            //未通过鉴权
            if (!isAuthed) {
                res.statusCode = 401;
                res.setHeader('WWW-Authenticate', 'Basic realm="Easy Monitor"');
                return res.send(httpUtils.composeMessage(6));
            }

            //判断是否允许用户进行 app 操作
            const needAppAuth = Boolean(~config.auth.app_auth_path.indexOf(req.path));
            const appName = req.query.name;
            //如果不设置 admin 节点，则认为鉴权成功均可操作 app
            if (needAppAuth && config.auth.admin) {
                const adminList = config.auth.admin;
                //用户是 admin 用户则无条件放行
                if (!~adminList.indexOf(credentials.name)) {
                    //非 admin 用户需要查看对该项目是否有操作权限
                    const projectAuthList = config.auth.project_auth && config.auth.project_auth[appName] || [];
                    if (!~projectAuthList.indexOf(credentials.name)) {
                        return res.send(httpUtils.composeMessage(7, credentials.name));
                    }
                }
            }

            //设置用户，通过鉴权
            req.__user__ = credentials.name;
            next();
        } catch (e) {
            dbl.error(`middleware.auth-> authentication error: ${e}`);
            return res.send(httpUtils.composeMessage(6));
        }
    }

    //加载鉴权中间件，仅在需要开启时开启
    config.auth && config.auth.need && app.use(co.wrap(authentication));
}