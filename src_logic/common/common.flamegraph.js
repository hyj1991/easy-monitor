'use strict';

/**
 * @description flamegraph 展示源自开源项目 https://github.com/thlorenz/flamegraph ，这里做了 web 化处理
 */
module.exports = function (_common, config, logger, utils) {

    // 初步解析 cpuprofile 数据
    class CPULogParser {
        constructor(profile) {
            this._profile = profile;
            this._paths = [];
            this._time = 0;
            this._each = 0;

            this._last = [];
            this._tmp = {};
            this._nodes = {};
        }

        /**
         * @param {object} node 
         * @description 组装展示的 func 名称
         */
        static funcName(node) {
            let n = node.functionName
            if (node.url) n += ' ' + node.url + ':' + node.lineNumber
            return n
        }

        /**
         * @param {string} a 
         * @param {string} b 
         * @description 对 call tree 进行聚合
         */
        static byFramesLexically(a, b) {
            let i = 0
            let framesA = a.frames
            let framesB = b.frames
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
                if (this._last[i] !== frames[i]) break
            }

            // 上述一样的函数位置赋值
            lenSame = i

            // 显然，从上次的 call tree 末尾开始，到本次 call tree 和上次相同的位置结束
            // 的这些函数，已经执行完毕，可以进行耗时统计
            for (i = lenLast; i >= lenSame; i--) {
                // 按照原始的 key 组装，i 显然就是函数深度
                k = this._last[i] + ';' + i
                // 将已经执行结束的函数耗时记录入 _nodes 数组待分析
                this._nodes[k + ';' + this._time] = { func: this._last[i], depth: i, etime: this._time, stime: this._tmp[k].stime }
                // 清空临时缓存
                this._tmp[k] = null
            }

            // 记录每一个函数的起始时间戳，可以看到从 lenSame 开始记录，意味着在一个函数彻底执行完毕前不会重复统计
            for (i = lenSame; i <= lenFrames; i++) {
                k = frames[i] + ';' + i
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
            stack.push(CPULogParser.funcName(node))

            if (node.hitCount) this._paths.push({ frames: stack.slice(), hitCount: node.hitCount })

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
         * @description 解析 cpuprofile 日志，初步分析得出函数 samples 的统计
         */
        process() {
            this._explorePaths(this._profile.head, []);
            this._processPaths();
            this._sampleInterval();
            return { nodes: this._nodes, time: this._time, each: this._each };
        }
    }

    // flamegraph 颜色
    const colorMap = (function () {
        function scalarReverse(s) {
            return s.split('').reverse().join('')
        }

        function nameHash(name) {
            let vector = 0
            let weight = 1
            let max = 1
            let mod = 10
            let ord

            name = name.replace(/.(.*?)`/, '')
            let splits = name.split('')
            for (let i = 0; i < splits.length; i++) {
                ord = splits[i].charCodeAt(0) % mod
                vector += (ord / (mod++ - 1)) * weight
                max += weight
                weight *= 0.70
                if (mod > 12) break
            }

            return (1 - vector / max)
        }

        function color(type, hash, name) {
            let v1, v2, v3, r, g, b
            if (!type) return 'rgb(0, 0, 0)'

            if (hash) {
                v1 = nameHash(name)
                v2 = v3 = nameHash(scalarReverse(name))
            } else {
                v1 = Math.random() + 1
                v2 = Math.random() + 1
                v3 = Math.random() + 1
            }

            switch (type) {
                case 'hot':
                    r = 205 + Math.round(50 * v3);
                    g = 0 + Math.round(230 * v1);
                    b = 0 + Math.round(55 * v2);
                    return `rgb(${r}, ${g}, ${b})`;
                case 'mem':
                    r = 0
                    g = 190 + Math.round(50 * v2)
                    b = 0 + Math.round(210 * v1)
                    return `rgb(${r}, ${g}, ${b})`
                case 'io':
                    r = 80 + Math.round(60 * v1)
                    g = r
                    b = 190 + Math.round(55 * v2)
                    return `rgb(${r}, ${g}, ${b})`
                default:
                    throw new Error('Unknown type ' + type)
            }
        }

        function colorMap(paletteMap, colorTheme, hash, func) {
            if (paletteMap[func]) return paletteMap[func]
            paletteMap[func] = color(colorTheme, hash, func)
            return paletteMap[func]
        }

        return colorMap;
    })()

    // 获取渲染的 context 信息
    const contextify = (function () {

        function oneDecimal(x) {
            return (Math.round(x * 10) / 10)
        }

        function htmlEscape(s) {
            return s
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
        }

        function contextify(parsed, opts) {
            let each = parsed.each;
            let time = parsed.time
            let timeMax = opts.timemax
            let ypadTop = opts.fontsize * 4           // pad top, include title
            let ypadBottom = opts.fontsize * 2 + 10      // pad bottom, include labels
            let xpad = 10                          // pad left and right
            let depthMax = 0
            let frameHeight = opts.frameheight
            let paletteMap = {}

            if (timeMax < time && timeMax / time > 0.02) {
                console.error('Specified timemax %d is less than actual total %d, so it will be ignored', timeMax, time)
                timeMax = Infinity
            }

            timeMax = Math.min(time, timeMax)

            let widthPerTime = (opts.imagewidth - 2 * xpad) / timeMax
            let minWidthTime = opts.minwidth / widthPerTime

            function markNarrowBlocks(nodes) {
                function mark(k) {
                    let val = parsed.nodes[k]
                    if (typeof val.stime !== 'number') throw new Error('Missing start for ' + k)
                    if ((val.etime - val.stime) < minWidthTime) {
                        val.narrow = true
                        return
                    }

                    val.narrow = false
                    depthMax = Math.max(val.depth, depthMax)
                }

                Object.keys(nodes).forEach(mark)
            }

            // NodeProcessor proto
            function processNode(node) {
                let func = node.func
                let depth = node.depth
                let etime = node.etime
                let stime = node.stime
                let factor = opts.factor
                let countName = opts.countname
                let isRoot = !func.length && depth === 0

                if (isRoot) etime = timeMax

                let samples = Math.round((etime - stime * factor) * 10) / 10
                let costTime = samples * each
                let samplesTxt = samples.toLocaleString()
                let pct
                let pctTxt
                let escapedFunc
                let name
                let sampleInfo

                if (isRoot) {
                    name = 'all'
                    sampleInfo = `(${samplesTxt} ${countName} ${utils.formatTime(costTime)}, 100%)`
                } else {
                    pct = Math.round((100 * samples) / (timeMax * factor) * 10) / 10
                    pctTxt = pct.toLocaleString()
                    escapedFunc = htmlEscape(func)

                    name = escapedFunc
                    sampleInfo = `(${samplesTxt} ${countName} ${utils.formatTime(costTime)}), ${pctTxt}%)`
                }

                let x1 = oneDecimal(xpad + stime * widthPerTime)
                let x2 = oneDecimal(xpad + etime * widthPerTime)
                let y1 = oneDecimal(imageHeight - ypadBottom - (depth + 1) * frameHeight + 1)
                let y2 = oneDecimal(imageHeight - ypadBottom - depth * frameHeight)
                let chars = (x2 - x1) / (opts.fontsize * opts.fontwidth)
                let showText = false
                let text

                if (chars >= 3) { // enough room to display function name?
                    showText = true
                    text = func.slice(0, chars)
                    if (chars < func.length) text = text.slice(0, chars - 2) + '..'
                    text = htmlEscape(text)
                }

                return {
                    name: name
                    , search: name.toLowerCase()
                    , samples: sampleInfo
                    , rect_x: x1
                    , rect_y: y1
                    , rect_w: x2 - x1
                    , rect_h: y2 - y1
                    , rect_fill: colorMap(paletteMap, opts.colors, opts.hash, func)
                    , text: text
                    , text_x: x1 + (showText ? 3 : 0)
                    , text_y: 3 + (y1 + y2) / 2
                    , narrow: node.narrow
                    , func: htmlEscape(func)
                }
            }

            function processNodes(nodes) {
                let keys = Object.keys(nodes)
                let acc = new Array(keys.length)

                for (let i = 0; i < keys.length; i++) {
                    acc[i] = processNode(nodes[keys[i]], each)
                }

                return acc
            }

            markNarrowBlocks(parsed.nodes)

            let imageHeight = (depthMax * frameHeight) + ypadTop + ypadBottom
            let ctx = Object.assign(opts, {
                imageheight: imageHeight
                , xpad: xpad
                , titleX: opts.imagewidth / 2
                , detailsY: imageHeight - (frameHeight / 2)
            })

            ctx.nodes = processNodes(parsed.nodes)
            return ctx
        }

        return contextify;
    })()

    function narrowify(context, opts) {
        function processNode(n) {
            n.class = n.narrow ? 'hidden' : ''
        }

        function filterNode(n) {
            return !n.narrow
        }

        if (opts.removenarrows) context.nodes = context.nodes.filter(filterNode)
        else context.nodes.forEach(processNode)
    }

    /**
     * @param {object} profile cpuprofile 文件
     * @return {object} 
     * @description 处理 cpuprofile 数据，返回 svg 处理完毕后渲染所需数据
     */
    function fetchSvgRenderContext(profile) {
        // 简单判断
        profile = typeof profile === 'object' && profile || utils.jsonParse(profile);
        // 初步解析规整 cpuprofile 日志
        const cpuLogParser = new CPULogParser(profile);
        const parsed = cpuLogParser.process();
        // 获取 falmegraph 配置
        const fconfig = config.flamegraph;
        // 获取 contextify 渲染数据
        const context = contextify(parsed, fconfig);
        narrowify(context, fconfig);

        return context;
    }

    return { fetchSvgRenderContext }
}