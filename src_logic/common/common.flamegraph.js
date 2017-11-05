'use strict';

/**
 * @description flamegraph 展示源自开源项目 https://github.com/thlorenz/flamegraph ，这里做了 web 化处理
 */
module.exports = function (_common, config, logger, utils) {

    // 初步解析 cpuprofile 数据
    class CPULogParser {
        constructor(profile, limit, filter) {
            this._profile = profile;
            this._limit = limit;
            this._filter = filter;

            this._paths = [];
            this._time = 0;
            this._each = 0;

            this._last = [];
            this._tmp = {};
            this._nodes = {};

            this._top = [];
            this._bail = [];
        }

        /**
         * @param {object} node 
         * @description 组装展示的 func 名称
         */
        static funcName(node, parent) {
            let n = node.functionName || 'anonymous';
            if (node.url) n += ' ' + node.url + ':' + node.lineNumber
            return {
                func: n,
                funcName: node.functionName || 'anonymous',
                bailoutReason: node.bailoutReason,
                parent,
                url: node.url && `(${node.url} ${node.lineNumber})` || `(${node.lineNumber})`
            }
        }

        /**
         * @param {string} a 
         * @param {string} b 
         * @description 对 call tree 进行聚合
         */
        static byFramesLexically(a, b) {
            let i = 0
            let framesA = a.frames.map(f => f.func)
            let framesB = b.frames.map(f => f.func)
            while (true) {
                if (!framesA[i]) return -1
                if (!framesB[i]) return 1
                if (framesA[i] < framesB[i]) return -1
                if (framesB[i] < framesA[i]) return 1
                i++
            }
        }

        /**
         * @param {array} functions 
         * @description 聚合 call tree
         */
        static sort(functions) {
            return functions.sort(CPULogParser.byFramesLexically)
        }

        /**
         * @param {array} frames 
         * @description 记录下每一次
         */
        _flow(frames) {
            let lenLast = this._last.length - 1
            let lenFrames = frames.length - 1
            let i
            let lenSame
            let k

            // 找到聚合后的上一次 call tree 和本次分析的 call tree 相同的那一层
            for (i = 0; i <= lenLast; i++) {
                // 因为所有函数都会从 root 函数调用起始
                // 这里查找返回的是本次 call tree 和上次 call tree 一样的函数位置
                if (i > lenFrames) break
                if (this._last[i].func !== frames[i].func) break
            }

            // 上述一样的函数位置赋值
            lenSame = i

            // 显然，从上次的 call tree 末尾开始，到本次 call tree 和上次相同的位置结束
            // 的这些函数，已经执行完毕，可以进行耗时统计
            for (i = lenLast; i >= lenSame; i--) {
                // 按照原始的 key 组装，i 显然就是函数深度
                k = this._last[i].func + ';' + i
                // 将已经执行结束的函数耗时记录入 _nodes 数组待分析
                this._nodes[k + ';' + this._time] = {
                    func: this._last[i].func,
                    funcName: this._last[i].funcName,
                    bailoutReason: this._last[i].bailoutReason,
                    url: this._last[i].url,
                    parent: this._last[i].parent,
                    depth: i,
                    etime: this._time,
                    stime: this._tmp[k].stime
                }
                this._last[i].stime = this._tmp[k].stime;
                this._last[i].etime = this._time;
                // 清空临时缓存
                this._tmp[k] = null
            }

            // 记录每一个函数的起始时间戳，可以看到从 lenSame 开始记录，意味着在一个函数彻底执行完毕前不会重复统计
            for (i = lenSame; i <= lenFrames; i++) {
                k = frames[i].func + ';' + i
                this._tmp[k] = { stime: this._time }
            }
        }

        /**
         * @param {object} path 
         * @description 处理第一步中统计的规整函数信息
         */
        _processPath(path) {
            this._flow(path.frames)
            this._time += path.hitCount
            this._last = path.frames
        }

        /**
         * @param {object} node 
         * @param {array} stack 
         * @description 深度优先遍历得到 profiling 期间的 stack 以及对应 sample 采集到的次数
         */
        _explorePaths(node, stack) {
            const parent = stack.length === 0 && { funcName: '-', mock: true } || stack[stack.length - 1];
            stack.push(CPULogParser.funcName(node, parent))
            // if (node.hitCount) {
            this._paths.push({ frames: stack.slice(), hitCount: node.hitCount })
            // }

            for (let i = 0; i < node.children.length; i++) {
                this._explorePaths(node.children[i], stack)
            }

            stack.pop()
        }

        /**
         * @description 聚合 call tree，计算出 call tree 上每一个 stack 在 profiling 期间的执行耗费
         */
        _processPaths() {
            CPULogParser.sort(this._paths)
            for (let i = 0; i < this._paths.length; i++) {
                this._processPath(this._paths[i])
            }

            this._flow([])
        }

        /**
         * @description 计算每一个采样时长
         */
        _sampleInterval() {
            let startTime = this._profile.startTime;
            let endTime = this._profile.endTime;
            this._each = (endTime - startTime) / this._time * 1000
        }

        /**
         * @description 规整耗时和逆优化函数
         */
        _getResults() {
            const nodes = this._nodes;
            const each = this._each;
            const funcList = Object.keys(nodes).filter(f => !this._filter || this._filter(nodes[f].url, nodes[f].funcName));
            funcList.forEach(f => {
                const execTime = (nodes[f].etime - nodes[f].stime) * each;
                nodes[f].execTime = execTime;
                if (nodes[f].parent.mock) {
                    nodes[f].percentage = '-';
                } else {
                    const pExecTime = (nodes[f].parent.etime - nodes[f].parent.stime) * each;
                    nodes[f].percentage = pExecTime && `${((execTime / pExecTime) * 100).toFixed(2)}%` || '100%';
                }
                nodes[f].parent = nodes[f].parent.funcName;
            });
            this._top = funcList.map(f => nodes[f]).sort((o, n) => Number(o.execTime) < Number(n.execTime) ||
                Number(o.execTime) === Number(n.execTime) && Number(o.depth) > Number(n.depth) ? 1 : -1)
                .filter((n, i) => i < Number(this._limit.top));
            this._bail = funcList.map(f => nodes[f]).filter(n => n.bailoutReason && n.bailoutReason !== 'no reason');
        }

        /**
         * @description 解析 cpuprofile 日志，初步分析得出函数 samples 的统计
         */
        process() {
            this._explorePaths(this._profile.head, []);
            this._processPaths();
            this._sampleInterval();
            this._getResults();
            return {
                nodes: this._nodes,
                time: this._time,
                each: this._each,
                top: this._top,
                bail: this._bail
            };
        }
    }

    /**
     * @param {object} profile cpuprofile 文件
     * @return {object} 
     * @description 处理 cpuprofile 数据，返回 svg 处理完毕后渲染所需数据
     */
    function fetchSvgRenderContext(profile, limit, filter) {
        // 简单判断
        profile = typeof profile === 'object' && profile || utils.jsonParse(profile);
        // 初步解析规整 cpuprofile 日志
        const cpuLogParser = new CPULogParser(profile, limit, filter);
        const parsed = cpuLogParser.process();
        // 获取 falmegraph 配置
        const fconfig = config.flamegraph;
        // 配置走服务器下发
        return {
            top: parsed.top,
            bail: parsed.bail,
            flamegraph: {
                fconfig,
                parsed: { nodes: parsed.nodes, time: parsed.time, each: parsed.each },
            }
        };
    }

    return { fetchSvgRenderContext }
}