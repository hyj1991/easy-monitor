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
     * @param {object} params @param {number} sequence
     * @return {string}
     * @description 获取缓存信息
     */
    function* getNowStat(params, sequence) {
        //组装缓存 key
        const key = common.profiler.composeKey(params);
        //从缓存中获取信息
        let cacheData = yield cacheUtils.storage.getP(config.cache.opt_list);
        cacheData = typeof cacheData === 'object' && cacheData || common.utils.jsonParse(cacheData);
        const result = Object.keys(cacheData).reduce((pre, next) => {
            if (~next.indexOf(key)) {
                const nextData = cacheData[next];
                const id = Number(next.replace(key, ''));
                if (id > pre.id) {
                    pre.id = id;
                    pre.res = nextData;
                }
                //合并已经完成的数据
                const nextObject = common.utils.jsonParse(nextData);
                if (nextObject && nextObject.results && Number(nextObject.results.sequence) > sequence) {
                    if (Array.isArray(nextObject.results.loadingMsg)) {
                        //避免重复设置已经履行过的状态
                        // pre.loadingMsgList = pre.loadingMsgList.concat(nextObject.results.loadingMsg);
                    } else {
                        pre.loadingMsgList.push(nextObject.results.loadingMsg);
                    }
                }
            }
            return pre;
        }, { id: 0, res: '{}', loadingMsgList: [] });

        let data = common.utils.jsonParse(result.res);
        dbl.debug(`http.axios.detail.getNowStat sequence is: ${sequence}, loadingMsgList is: [${result.loadingMsgList}]`);
        //设计一些友好的容错
        if (data.results && result.loadingMsgList.length !== 0) data.results.loadingMsg = result.loadingMsgList;
        if (JSON.stringify(data) === '{}') {
            data = {
                done: false,
                results: common.profiler.template({
                    pid: params.pid,
                    name: params.name,
                    unique: config.embrace.machine_unique_key
                }, config.profiler[params.opt].init())
            }
        }

        //先返回大小，再返回数据
        if (data.done === true && !data.error && !data.setSize) {
            data.done = false;
            const dataTmp = data.results.data;
            const sequenceTmp = Number(data.results.sequence);
            data.results.data = null;
            setImmediate(() => {
                data.results.sequence = sequenceTmp + 1;
                data.results.data = dataTmp;
                data.done = true;
                //表示已经设置过一次了，无需再次设置
                data.setSize = true;
                cacheUtils.storage.setP(`${key}${result.id}`, data, config.cache.opt_list).catch(e => dbl.error(`http.axios.detail->getNowStat error: ${e}`));
            });
        }

        return JSON.stringify(data);
    }

    /**
     * @param {string} data 
     * @description 根据传入的 data 结构内容，判断是否需要清除掉缓存
     */
    function* clearCache(params, data) {
        data = common.utils.jsonParse(data);
        if (data.done) {
            //组装缓存 key
            const key = common.profiler.composeKey(params);
            //清除缓存
            let cacheData = yield cacheUtils.storage.getP(config.cache.opt_list);
            cacheData = typeof cacheData === 'object' && cacheData || common.utils.jsonParse(cacheData);
            const cacheList = Object.keys(cacheData);
            for (let i = 0, l = cacheList.length; i < l; i++) {
                if (~cacheList[i].indexOf(key)) {
                    yield cacheUtils.storage.delP(cacheList[i], config.cache.opt_list);
                }
            }
        }
    }

    /**
     * @description 获取 cpu / memory profiler 详细信息
     */
    function* axiosProfilerDetail(req, res, next) {
        try {
            const body = req.body;
            const data = body && body.data;
            dbl.debug(`http.axios.detail receive data: ${JSON.stringify(data)}`);

            //body 为空返回错误
            if (!data) res.send(httpUtils.composeMessage(1));

            //根据组装 key 方式获取缓存数据
            const params = { pid: data.pid, opt: data.opt, name: data.processName, server: data.serverName };
            const sequence = Number(data.sequence);
            const result = yield getNowStat(params, sequence);

            res.send(httpUtils.composeMessage(0, result));

            //判断是否需要清除掉缓存
            yield clearCache(params, result);
        } catch (e) {
            dbl.error(`http.axios.detail error: ${e}`);
            res.send(httpUtils.composeMessage(3));
        }
    }

    //以下是此 controller 文件注册的路由
    app.post(`${config.http.prefix}/${config.http.router.axios_detail}`, co.wrap(axiosProfilerDetail));
}