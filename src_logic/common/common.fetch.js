'use strict';

module.exports = function (_common, config, logger, utils) {

    /**
     * @param {object} data
     * @description 内部方法，获取 auth 配置
     */
    function _getAuthConfig(data) {
        const auth = config.auth;
        const name = data.name || '';
        return {
            need: auth.need,
            admin: auth.admin,
            project_auth: auth.project_auth && auth.project_auth[name] || [],
            disable: {
                need: auth.need_disable,
                admin: auth.admin_disable,
                project: auth.project_auth_disable
            }
        }
    }

    /**
     * @param {object} result @param {object} data
     * @description 动态获取实时配置
     */
    function getConfig(result, data) {
        //获取运行模式
        result.mode = {
            cluster: config.cluster && 'cluster' || 'default',
            disable: config.cluster_disable
        };

        //获取日志级别
        result.logger = {
            log_level: config.logger.log_level,
            disable: config.logger.disable
        };

        //获取 profiler 相关
        result.profiler = {
            mode: config.profiler.mode,
            modeDisable: config.profiler.modeDisable
        };

        //获取 CPU 参数
        const optionalCpu = config.profiler.cpu.optional;
        result.cpu = {
            //cpu profiling 时长
            profiling_time: config.profiler.cpu.profiling_time,
            //过滤时长
            timeout: optionalCpu.timeout,
            //展示条数限制
            long_limit: optionalCpu.long_limit,
            top_limit: optionalCpu.top_limit,
            bail_limit: optionalCpu.bail_limit,
            //是否启用过滤
            need_filter: config.profiler.need_filter,
            //是否允许修改
            disable: {
                profiler: config.profiler.cpu.profiling_time_disable,
                timeout: optionalCpu.timeout_disable,
                long: optionalCpu.long_disable,
                top: optionalCpu.top_disable,
                bail: optionalCpu.bail_disable,
                filter: config.profiler.need_filter_disable
            }
        };

        //获取 Memory 参数
        const optionalMem = config.profiler.mem.optional;
        result.memory = {
            //是否展示 root 节点
            need_root: optionalMem.need_root,
            //leak point 展示个数限制
            leakpoint_limit: optionalMem.leakpoint_limit,
            //是否采用 stream 读取，暂不开放修改
            not_stream: optionalMem.not_stream,
            //展示多少个子节点限制
            node_limit: optionalMem.node_limit,
            //root 节点展示深度
            distance_root_limit: optionalMem.distance_root_limit,
            //非 root 节点展示深度
            distance_limit: optionalMem.distance_limit,
            //是否允许修改
            disable: {
                root: optionalMem.need_root_disable,
                leakpoint: optionalMem.leakpoint_limit_disable,
                stream: optionalMem.not_stream_disable,
                children: optionalMem.node_limit_disable,
                rootd: optionalMem.distance_root_limit_disable,
                regulard: optionalMem.distance_limit_disable
            }
        }

        //获取 auth 参数
        const auth = config.auth || {};
        const name = data.name || '';
        result.auth = _getAuthConfig(data);
    }

    /**
     * @param {object} data @param {logger} dbl
     * @param {object} result 存储结果
     * @description 动态更改配置文件
     */
    function modifyConfig(data, dbl, result) {
        //修改日志
        const logLevel = data.logger && data.logger.log_level;
        if (logLevel) {
            config.logger.log_level = logLevel;
            logger.setLevel(logLevel);
            if (dbl) dbl.setLevel(logLevel);
            if (result) result.logger = true;
        }

        //修改采集数据分析模式
        const profilerMode = data.profiler && data.profiler.mode;
        if (!isNaN(profilerMode)) {
            config.profiler.mode = Number(profilerMode);
        }

        //修改 cpu
        const cpu = data.cpu || {};
        const optionalCpu = config.profiler.cpu.optional;
        if (cpu.need_filter === true || cpu.need_filter === false) config.profiler.need_filter = cpu.need_filter;
        if (cpu.profiling_time && !isNaN(cpu.profiling_time)) config.profiler.cpu.profiling_time = Number(cpu.profiling_time);
        if (cpu.timeout && !isNaN(cpu.timeout)) optionalCpu.timeout = Number(cpu.timeout);
        if (cpu.long_limit && !isNaN(cpu.long_limit)) optionalCpu.long_limit = Number(cpu.long_limit);
        if (cpu.top_limit && !isNaN(cpu.top_limit)) optionalCpu.top_limit = Number(cpu.top_limit);
        if (cpu.bail_limit && !isNaN(cpu.bail_limit)) optionalCpu.bail_limit = Number(cpu.bail_limit);

        //修改 memory
        const memory = data.memory || {};
        const optionalMem = config.profiler.mem.optional;
        if (memory.need_root === true || memory.need_root === false) optionalMem.need_root = memory.need_root;
        if (memory.leakpoint_limit && !isNaN(memory.leakpoint_limit)) optionalMem.leakpoint_limit = memory.leakpoint_limit;
        if (memory.node_limit && !isNaN(memory.node_limit)) optionalMem.node_limit = memory.node_limit;
        if (memory.distance_root_limit && !isNaN(memory.distance_root_limit)) optionalMem.distance_root_limit = memory.distance_root_limit;
        if (memory.distance_limit && !isNaN(memory.distance_limit)) optionalMem.distance_limit = memory.distance_limit;

        //修改 admin
        const auth = data.auth || {};
        const name = data.name || '';
        if (Array.isArray(auth.admin)) config.auth.admin = auth.admin;
        if (Array.isArray(auth.project_auth)) {
            if (typeof config.auth.project_auth !== 'object' || !config.auth.project_auth) {
                config.auth.project_auth = {};
            }
            config.auth.project_auth[name] = auth.project_auth;
        }
    }

    /**
     * @param {object} clientConfig
     * @return {object}
     * @description 对于某些在 cluster 模式需要读取 dashboard 配置项进行更新
     */
    function dashboardConfigMerge(clientConfig, data) {
        //简单校验
        if (!clientConfig || !data) return;
        if (typeof clientConfig !== 'object' || typeof data !== 'object') return;

        //cluster 模式下
        if (config.cluster) {
            //auth 鉴权部分需要替换为 dashboard 配置
            if (clientConfig.auth) {
                clientConfig.auth = _getAuthConfig(data);
            }
        }

        return clientConfig;
    }

    //导出 common 方法
    return { getConfig, modifyConfig, dashboardConfigMerge }
}
