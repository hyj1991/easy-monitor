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
            const name = req.query.name || data.name;
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
                const key = projectProcessList[Date.now() % projectProcessList.length];
                socketList.push({ socket: processObject[key], key });
            }
            //modify 通知所有进程
            if (data.type === 'modify') {
                //先对 dashboard 进程进行配置更改
                if (cacheUtils.thirdCache()) {
                    //开启第三方缓存情况下可能存在多个 dashboard，必须通知到所有一起进行更改
                    const message = socketUtils.composeMessage('oth', 1, { data });
                    //获取当前项目所有的 dashboard 进程
                    let serverList = common.utils.jsonParse(yield cacheUtils.storage.getP(config.cache.dashboard_list));
                    //通知更新配置
                    for (let i = 0, l = serverList.length; i < l; i++) {
                        const channel = common.mq.composeChannel(config.mq.process_key, serverList[i]);
                        common.mq.publish(channel, { type: config.message.other[1], msg: message });
                    }
                } else {
                    //非第三方缓存情况下一定只有一个 dashbard，故只需要简单修改自身配置即可
                    common.fetch.modifyConfig(data, dbl);
                }
                //通知该项目下的所有进程
                projectProcessList.forEach(key => socketList.push({ socket: processObject[key], key }));
            }

            const notifyListP = [];
            const eventListP = [];
            for (let i = 0, l = socketList.length; i < l; i++) {
                const key = socketList[i].key;
                const socket = socketList[i].socket;

                //组装发送给客户端的信息，生成唯一的记录 ID
                const messageId = `${(new Date() - 0)}_${Math.random().toString(16).substr(2, 8)}`;
                const message = socketUtils.composeMessage('req', 10, { messageId, raw: data });

                //针对开启缓存和没有开启缓存模式进行分别处理
                if (cacheUtils.thirdCache()) {
                    //找出对应的心跳 server，并将消息发送到这里去
                    const channel = common.mq.composeChannel(config.mq.process_key, socket);
                    common.mq.publish(channel, { key, msg: message });
                } else {
                    //此处注意要兼容 cluser 和默认模式，故不能直接采用 socketUtils.sendMessage
                    const ctx = { common, config, dbl };
                    notifyListP.push(socketUtils.notifySide.apply(ctx, [message, socket]));
                }
                //侦听响应
                eventListP.push(new Promise(resolve => {
                    if (cacheUtils.thirdCache()) {
                        //开启第三方缓存时走消息队列
                        common.mq.subscribeOnce(messageId, (err, channel, response) => {
                            resolve(common.utils.jsonParse(response));
                        });
                    } else {
                        //非第三方缓存开启时走 event 事件库
                        common.utils.event.once(messageId, resolve);
                    }
                    //设置超时时间，防止卡死在这里
                    setTimeout(resolve, config.http.timeout);
                }));
            }

            //并发通知
            yield notifyListP;
            //并发事件监听获取数据
            let result = null;
            const response = yield eventListP;
            if (data.type === 'get') {
                result = response[0];
                common.fetch.dashboardConfigMerge(result, data);
            } else {
                result = response;
            }

            //没有响应，返回错误
            if (!result) return res.send(httpUtils.composeMessage(3));
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