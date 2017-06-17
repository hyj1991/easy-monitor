'use strict';
const gzipSize = require('gzip-size');
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
    const pretty = prettyBytes(gzipSize.sync(data)) || '';

    return String(pretty.toUpperCase());
}

/**
 * @param {number} ts
 * @return {string}
 * @description 对 ms 级别的时间进行格式化
*/
function _formatTime(ts) {
    let str = '';
    if (ts < 1e3) {
        str = `${ts.toFixed(2)} ms`;
    } else if (ts < 1e6) {
        str = `${(ts / 1e3).toFixed(2)} s`;
    } else if (ts < 1e9) {
        str = `${(ts / 1e6).toFixed(2)} min`;
    } else if (ts < 1e12) {
        str = `${(ts / 1e9).toFixed(2)} h`;
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
             * @description cpu / mem 采集数据分析采用：0 就地分析(默认)，1 上报分析
             */
            mode: 0,

            //最终完成态 key 增加后缀
            finish: '_FINISH',

            //定义 cpu profiling 操作期间的文字提示
            cpu: {
                //cpu profiling 时间长短
                profiling_time: 5 * 1000,

                //可选配置参数
                optional: {
                    /**
                     * @type {number}
                     * @description 过滤出执行时长 > 500ms 的函数，单位 ms
                     */
                    timeout: 500,
                    /**
                     * @type {number}
                     * @description 过滤出执行时长 > 设置的 ms 的函数个数，默认展示 5 个
                     */
                    long: 5,
                    /**
                     * @type {number}
                     * @description 过滤出执行时长最长的 5 个函数
                     */
                    top: 5,
                    /**
                     * @type {number}
                     * @description 过滤出 V8 引擎逆优化最频繁的 5 个函数
                     */
                    bail: 5
                },

                //初始化阶段的提示
                init(info) {
                    info = info || '';
                    return `通知${info}业务进程进行 CPU 数据采集...`;
                },
                //已经通知到业务进程
                start_profiling(info) {
                    info = info || '';
                    return `${info}开始进行 CPU 数据采集，约耗费 ${_formatTime(config.profiler.cpu.profiling_time)}...`;
                },
                //cpu profing 结束
                end_profiling(info) {
                    info = info || '';
                    return `${info}采集 CPU 数据完毕，即将开始分析...`;
                },
                //cpu analysis 结束
                end_analysis(data) {
                    return `CPU 数据分析完毕，正在传输，大小为: ${_gzip(data)}...`;
                },
                //所有操作完毕，准备返回给客户端数据
                end(data) {
                    data = typeof data === 'object' && JSON.stringify(data) || data;
                    const gzip = gzipSize.sync(data);
                    return `分析数据准备完毕，大小为: ${prettyBytes(gzip)}，请耐心等待下载...`;
                }
            },

            //定义 memory profiling 操作期间的文字提示
            mem: {
                //可选配置参数
                optional: {
                    //限制展开多少个节点
                    node_limit: 5,

                    //数据记录深度
                    distance_limit: 25,

                    //记录根节点深度
                    distance_root_limit: 6,

                    //展示疑似泄漏点深度
                    leak_limit: 8,

                    //profiling 是否采用 stream
                    not_stream: false
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
                    if (stream) str = `${info}Memory Stream 准备完毕，开始流式读取，此过程较慢，请耐心等待...`;
                    else str = `${info}采集 Memory 数据完毕，即将开始分析...`;
                    return str;
                },
                //cpu analysis 结束
                end_analysis(data) {
                    return `Memory 数据分析完毕，正在传输，大小为: ${_gzip(data)}...`;
                },
                //所有操作完毕，准备返回给客户端数据
                end(data) {
                    return `分析数据准备完毕，大小为: ${_gzip(data)}，请耐心等待下载...`;
                }
            },

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

                //结构路径中必须包含有 /
                const mustHave = [/^\(\/.*/].every(regexp => {
                    return Boolean(regexp.test(filePath));
                });

                return !needIgnore && mustHave;
            }
        }
    }
}