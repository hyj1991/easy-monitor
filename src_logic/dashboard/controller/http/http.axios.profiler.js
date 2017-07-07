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
     * @param {string} name @param {string} server @param {string} pid
     * @description 判断当前进程是否存在
     */
    function* isExistsP(name, server, pid) {
        const key = common.socket.composeKey({ name, server, pid });
        const socket = yield cacheUtils.storage.getP(key, config.cache.socket_list);
        return Boolean(socket);
    }

    /**
     * @param {object} params @param {object} list
     * @description 对未初始化的进程操作请求进行缓存初始化
     */
    function* initCache(params, list) {
        //组装缓存 key
        const key = common.profiler.composeKey(params);

        //组装缓存 value
        const result = {
            done: false,
            results: common.profiler.template({
                pid: params.pid,
                name: params.name,
                unique: config.embrace.machine_unique_key
            }, config.profiler[params.opt].init())
        }
        //如果已经存在，则 continue
        const oldResult = yield cacheUtils.storage.getP(key, config.cache.opt_list);
        if (oldResult) {
            list.hasInitList.push(`${params.name}_${params.server}_${params.pid}_${params.opt}`);
            return;
        }
        //将初始化后的数据结构塞进缓存
        list.initList.push(`${params.name}_${params.server}_${params.pid}_${params.opt}`);
        yield cacheUtils.storage.setP(key, result, config.cache.opt_list);

        //做一个异常检测盘简单判定，3s 后还未发现缓存数据变更，则认为本次操作失败
        setTimeout(co.wrap((function* (key, result) {
            const old = yield cacheUtils.storage.getP(`${key}`, config.cache.opt_list);
            const res = yield cacheUtils.storage.getP(`${key}1`, config.cache.opt_list);
            //初始化数据也不在了，则认为发生错误被清空
            if (old && !res) {
                result.done = true;
                result.error = 'Notify embrace process failed, Please refresh this page!';
                yield cacheUtils.storage.setP(`${key}1`, result, config.cache.opt_list);
            }
        })).bind(null, key, result), config.http.timeout);
    }

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
        const message = socketUtils.composeMessage('req', 2, params);

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
     * @description 客户端通知服务器开始进行 profiler 操作
     */
    function* axiosProfiler(req, res, next) {
        try {
            const body = req.body;
            const data = body && body.data;
            dbl.debug(`http.axios.profiler receive data: ${JSON.stringify(data)}`);

            //body 为空返回错误
            if (!data) res.send(httpUtils.composeMessage(1));

            //初始化 cpu / mem 操作数据结构
            const pidList = Array.isArray(data.pidList) && data.pidList || [];
            //判断已经初始化和未初始化的操作列表
            const initList = [];
            const hasInitList = [];

            for (let i = 0, l = pidList.length; i < l; i++) {
                //判断当前请求的进程信息是否存在，如果不存在，直接返回 success: false 即可
                if (!(yield isExistsP(data.processName, data.serverName, pidList[i]))) {
                    res.send(httpUtils.composeMessage(2));
                    return;
                }

                //通知业务进程执行对应的 cpu / mem profiling 操作
                const progress = { name: data.processName, server: data.serverName, pid: pidList[i] };
                const r = yield notifyProcess(progress, { opt: data.opt, raw: progress });
                if (!r) return res.send(httpUtils.composeMessage(4));

                //对当前操作进程进行对应的缓存初始化
                yield initCache({
                    pid: pidList[i],
                    opt: data.opt,
                    name: data.processName,
                    server: data.serverName
                }, { hasInitList, initList });
            };

            res.send(httpUtils.composeMessage(0, { message: `[${initList}] 任务初始化成功, [${hasInitList}] 任务已经初始化!` }));
        } catch (e) {
            dbl.error(`http.axios.profiler error: ${e}`);
            res.send(httpUtils.composeMessage(3));
        }
    }

    //以下是此 controller 文件注册的路由
    app.post(`${config.http.prefix}/${config.http.router.axios_profiler}`, co.wrap(axiosProfiler));
}