'use strict';
const v8Profiler = require('v8-profiler');
const analysisLib = require('v8-analytics');

module.exports = function (_common, config, logger, utils) {

    /**
     * @param {object} option @param {string} msg @param {object} data
     * @description 模板方法，生成真正的结构化数据
     */
    function template(option, msg, data) {
        data = data || {};
        //组装数据
        const result = {
            "sequence": 0,
            "machineUnique": option.unique,
            "projectName": option.name,
            "processPid": option.pid,
            "loadingMsg": msg,
            "data": data
        };

        return result;
    }

    /**
     * @param {object} params 
     * @description 用于组装 profiler 的 key
     */
    function composeKey(params) {
        const key = {
            pid: params.pid,
            opt: params.opt,
            name: params.name,
            server: params.server,
        }

        return JSON.stringify(key);
    }

    /**
     * @param {string} title
     * @description 进行 cpu profiling 操作
     */
    function cpuProfilerP(title) {
        return new Promise((resolve) => {
            title = title || '';
            v8Profiler.startProfiling(title, true);

            setTimeout(() => {
                const profiler = v8Profiler.stopProfiling(title);
                profiler.delete();
                resolve(profiler);
            }, config.profiler.cpu.profiling_time);
        })
    }

    /**
     * @param {string} type @param {object} params @param {object} profiler
     * @description 对 profiling 得到的结果进行解析
     */
    function analyticsP(type, profiler, params) {
        params = params || {};
        const result = {};
        if (type === 'cpu') {
            const optional = config.profiler.cpu.optional;
            result.timeout = params.timeout || optional.timeout;
            result.longFunctions = analysisLib(profiler, params.timeout || optional.timeout, false, true, { limit: params.long_limit || optional.long_limit }/*, config.filterFunction*/);
            result.topExecutingFunctions = analysisLib(profiler, 1, false, true, { limit: params.top_limit || optional.top_limit }/*, config.filterFunction*/);
            result.bailoutFunctions = analysisLib(profiler, null, true, true, { limit: params.bail_limit || optional.bail_limit }/*, config.filterFunction*/);
        }

        return result;
    }

    return { template, composeKey, cpuProfilerP, analyticsP }
}