'use strict';
const prettyBytes = require('pretty-bytes');

/**
 * @param {object | string} data @param {string} unknown 
 * @return {string}
 * @description 计算压缩为文件大小
 */
function _gzip(data, unknown) {
    //如果没有数据，直接返回预设的 unknown 字段
    unknown = unknown || '未知'
    if (!data) return unknown;

    //否则返回 gizp 后大小
    data = typeof data === 'object' && JSON.stringify(data) || data;
    const pretty = prettyBytes(data.length);

    return String(pretty.toUpperCase());
}

/**
 * @param {number} ts
 * @return {string}
 * @description 对 ms 级别的时间进行格式化
*/
function _formatTime(ts) {
    ts = !isNaN(ts) && ts || 0;
    let str = '';
    if (ts < 1e3) {
        str = `${ts.toFixed(2)} ms`;
    } else if (ts < 1e3 * 60) {
        str = `${(ts / 1e3).toFixed(2)} s`;
    } else if (ts < 1e3 * 60 * 60) {
        str = `${(ts / (1e3 * 60)).toFixed(2)} min`;
    } else if (ts < 1e3 * 60 * 60 * 60) {
        str = `${(ts / (1e3 * 60 * 60)).toFixed(2)} h`;
    } else {
        str = `${ts.toFixed(2)} ms`;
    }

    return str;
}

exports = module.exports = function (config) {
    return {
        profiler: {
            /**
             * @type {number}
             * @description cpu / mem 采集数据分析采用：0 就地分析(默认)，1 开启子进程分析
             */
            mode: 1,

            //是否允许修改
            modeDisable: false,

            //最终完成态 key 增加后缀
            finish: '_FINISH',

            //定义 cpu profiling 操作期间的文字提示
            cpu: {
                //cpu profiling 时间长短，默认开启 5min
                profiling_time: 300 * 1000,

                //是否允许更改
                profiling_time_disable: false,

                //定时检查时长，半分钟检查一次
                profiling_check_time: 30 * 1000,

                //可选配置参数
                optional: {
                    /**
                     * @type {number}
                     * @description 过滤出执行时长 > 500ms 的函数，单位 ms
                     */
                    timeout: 500,

                    /** 是否允许修改 */
                    timeout_disable: false,
                    /**
                     * @type {number}
                     * @description 过滤出执行时长 > 设置的 ms 的函数个数，默认展示 5 个
                     */
                    long_limit: 5,

                    /** 是否允许修改 */
                    long_disable: false,

                    /**
                     * @type {number}
                     * @description 过滤出执行时长最长的 5 个函数
                     */
                    top_limit: 5,

                    /** 是否允许修改 */
                    top_disable: false,

                    /**
                     * @type {number}
                     * @description 过滤出 V8 引擎逆优化最频繁的 5 个函数
                     */
                    bail_limit: 5,

                    /** 是否允许修改 */
                    bail_disable: false
                },

                //初始化阶段的提示
                init(info) {
                    info = info || '';
                    return `通知${info}业务进程进行 CPU 数据采集...`;
                },
                //已经通知到业务进程
                start_profiling(remain) {
                    return `开始进行 CPU 数据采集，约耗费 ${_formatTime(config.profiler.cpu.profiling_time)}${!isNaN(remain) && `，剩余时间 ${_formatTime(remain)}` || ``}...`;
                },
                //cpu profing 结束
                end_profiling(info) {
                    info = info || '';
                    const extra = Number(config.profiler.mode) === 1 && '开启子进程' || '开始'
                    return `${info}采集 CPU 数据完毕，即将${extra}进行数据分析...`;
                },
                //cpu analysis 结束
                end_analysis(data) {
                    return `CPU 数据分析完毕，正在传输，原始大小为: ${_gzip(data)}...`;
                },
                //所有操作完毕，准备返回给客户端数据
                end(data) {
                    return `分析数据准备完毕，原始大小为: ${_gzip(data)}，请耐心等待下载...`;
                }
            },

            //定义 memory profiling 操作期间的文字提示
            mem: {
                //可选配置参数
                optional: {
                    //是否输出根节点
                    need_root: false,

                    /** 是否允许修改 */
                    need_root_disable: false,

                    //输出多少个疑似泄漏点
                    leakpoint_limit: 5,

                    /** 是否允许修改 */
                    leakpoint_limit_disable: false,

                    //profiling 是否采用 stream
                    not_stream: false,

                    /** 是否允许修改 */
                    not_stream_disable: true,

                    //限制展开多少个节点
                    node_limit: 5,

                    /** 是否允许修改 */
                    node_limit_disable: false,

                    //记录根节点深度
                    distance_root_limit: 6,

                    /** 是否允许修改 */
                    distance_root_limit_disable: false,

                    //数据记录深度
                    distance_limit: 25,

                    /** 是否允许修改 */
                    distance_limit_disable: false,

                    //展示疑似泄漏点深度
                    leak_limit: 8,

                    //展示全量数据的深度
                    child_node_display: 4,
                },

                //初始化阶段的提示
                init(info) {
                    info = info || '';
                    return `通知${info}业务进程进行 Memory 数据采集...`;
                },
                //已经通知到业务进程
                start_profiling(info) {
                    info = info || '';
                    return `${info}开始进行 Memory 数据采集...`;
                },
                //cpu profing 结束
                end_profiling(info, stream) {
                    info = info || '';
                    let str = '';
                    const extra = Number(config.profiler.mode) === 1 && '开启子进程' || '开始'
                    if (stream) str = `${info}Memory Stream 准备完毕，即将${extra}进行流式读取，此过程较慢，请耐心等待...`;
                    else str = `${info}采集 Memory 数据完毕，即将${extra}进行数据分析...`;
                    return str;
                },
                //cpu analysis 结束
                end_analysis(data) {
                    return `Memory 数据分析完毕，正在传输，原始大小为: ${_gzip(data)}...`;
                },
                //所有操作完毕，准备返回给客户端数据
                end(data) {
                    return `分析数据准备完毕，原始大小为: ${_gzip(data)}，请耐心等待下载...`;
                }
            },

            /** 是否需要进行过滤 */
            need_filter: true,

            /** 是否允许修改 */
            need_filter_disable: false,

            /**
             * @param {string} filePath 文件路径
             * @param {string} funcName 函数名
             * @description 过滤无关函数
             */
            filter_function: function (filePath, funcName) {
                //过滤掉包含 node_modules 和 anonymous 的函数
                const needIgnore = ['node_modules', 'anonymous'].some(fileName => {
                    return Boolean(~(filePath.indexOf(fileName))) || Boolean(~(funcName.indexOf(fileName)))
                });

                //结构路径必须以 "(/" 开始
                const mustHave = [/^\(\/.*/].every(regexp => {
                    return Boolean(regexp.test(filePath));
                });

                return !needIgnore && mustHave;
            }
        }
    }
}