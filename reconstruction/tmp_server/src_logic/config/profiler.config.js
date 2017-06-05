'use strict';
const gzipSize = require('gzip-size');
const prettyBytes = require('pretty-bytes');

exports = module.exports = {
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
                return `${info}开始进行 CPU 数据采集...`;
            },
            //cpu profing 结束
            end_profiling(info) {
                info = info || '';
                return `${info}CPU 数据采集完毕，即将开始分析...`;
            },
            //cpu analysis 结束
            end_analysis(info) {
                info = info || '';
                return `${info}CPU 数据分析完毕，正在传输...`;
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
            optional: {},

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
            end_profiling(info) {
                info = info || '';
                return `${info}采集 Memory 数据完毕，开始分析...`;
            },
            //cpu analysis 结束
            end_analysis(info) {
                info = info || '';
                return `${info}Memory 数据分析完毕，正在传输...`;
            },
            //所有操作完毕，准备返回给客户端数据
            end(data) {
                data = typeof data === 'object' && JSON.stringify(data) || data;
                const gzip = gzipSize.sync(data);
                return `分析数据准备完毕，大小为: ${prettyBytes(gzip)}，请耐心等待下载...`;
            }
        }
    }
}