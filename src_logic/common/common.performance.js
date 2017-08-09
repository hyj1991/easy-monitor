'use strict';
const co = require('co');

/**
 * @description 此部分代码参考了 chrome dev tools 的实现，加了注释，方便源码阅读者的理解
 */
module.exports = function (_common, config, logger, utils) {
    /**
 * @param {object} node @param {number} sampleTime
 * @return {object}
 * @description 每一个节点模板
 */
    function profileNodeTemplate(node, sampleTime) {
        return {
            functionName: node.functionName || 'anonymous',
            scriptId: node.scriptId,
            url: node.url,
            lineNumber: node.lineNumber,
            callUID: `@${node.callUID}`,
            self: Number(node.hitCount * sampleTime),
            total: 0,
            id: node.id,
            parent: null,
            children: [],
            bailoutReason: node.bailoutReason && node.bailoutReason !== 'no reason' ? node.bailoutReason : null
        }
    }

    /**
     * @param {object} profile 
     * @description 对部分 profile 数据进行初始化操作
     */
    function initAttribution(profile) {
        //计算开始时间
        profile.profileStartTime = profile.startTime * 1000;
        //计算结束时间
        profile.profileEndTime = profile.endTime * 1000;
    }

    /**
     * @param {object} profile 
     * @description 扁平化树结构
     */
    function flatHeadNodes(profile) {
        const nodes = [];
        //递归获取调用栈信息，将每一个节点塞入 nodes 数组中
        _flatNodesTree(profile.head);
        //扁平化后，head 节点已经无用，删除掉
        profile.nodes = nodes;
        delete profile.head;

        /**
         * @param {object} node
         * @return {number}
         * @description 内部方法，递归处理 head 节点起始的 tree
         */
        function _flatNodesTree(node) {
            nodes.push(node);
            node.children = node.children.map(_flatNodesTree);
            //每一个节点中的 children 以 id 替代原本的对象，扁平化操作
            return node.id;
        }
    }

    /**
     * @param {object} profile 
     * @description 遍历树结构，构造出完整的从 head 节点开始的 tree
     */
    function createHeadTree(profile) {
        //获取 nodes 扁平化数组
        const nodes = profile.nodes;

        //构造了 map 对象，存储 id - 节点映射关系
        const nodeByIdMap = new Map();
        for (let i = 0; i < nodes.length; ++i) {
            const node = nodes[i];
            nodeByIdMap.set(node.id, node);
        }

        //计算 profiling 期间的总命中次数，从而得出采样间隔，单位为 ms
        const totalHitCount = nodes.reduce((t, h) => t + Number(h.hitCount), 0);
        const sampleTime = (profile.profileEndTime - profile.profileStartTime) / totalHitCount;

        //递归生成 root 节点起始的 tree 结构
        const root = nodes[0];
        const resultRoot = profileNodeTemplate(root, sampleTime);
        //这里注意两个数组的对应关系总是保持同样的 index 下，parent -> child，这样可以做到最小化开销下的遍历
        const parentNodeStack = root.children.map(() => resultRoot);
        const sourceNodeStack = root.children.map(id => nodeByIdMap.get(id));
        //进入循环遍历
        while (sourceNodeStack.length) {
            let parentNode = parentNodeStack.pop();
            let sourceNode = sourceNodeStack.pop();
            if (!sourceNode.children) sourceNode.children = [];
            let targetNode = profileNodeTemplate(sourceNode, sampleTime);

            //这里实现了子节点对象存入父节点的 children 属性数组中
            parentNode.children.push(targetNode);

            //增加子节点数据信息
            parentNodeStack.push.apply(parentNodeStack, sourceNode.children.map(() => targetNode));
            sourceNodeStack.push.apply(sourceNodeStack, sourceNode.children.map(id => nodeByIdMap.get(id)));
        }

        //nodes 使用完毕销毁掉腾出内存
        delete profile.nodes;
        profile.resultRoot = resultRoot;
    }

    /**
     * @param {object} profile
     * @description 构建深度优先树最深度和父子节点引用关系
     */
    function buildParentAndDepth(profile) {
        const root = profile.resultRoot;
        root.depth = -1;
        root.parent = null;
        profile.maxDepth = 0;
        const tmpList = [root];
        //进入循环遍历
        while (tmpList.length) {
            const parent = tmpList.pop();
            const depth = parent.depth + 1;
            //每次将最深的深度比较得出赋值
            if (depth > profile.maxDepth) profile.maxDepth = depth;
            const children = parent.children;
            for (let i = 0, l = children.length; i < l; ++i) {
                const child = children[i];
                child.depth = depth;
                child.parent = parent;
                //继续塞入子节点，保持 while 循环
                if (child.children.length) tmpList.push(child);
            }
        }
    }

    /*** 
     * @param {object} profile
     * @description 计算各个节点的 total 属性值
     */
    function buildTotals(profile) {
        const root = profile.resultRoot;
        const tmpList = [root];
        const nodeList = [];
        //进入循环遍历
        while (tmpList.length) {
            const node = tmpList.pop();
            node.total = node.self;
            nodeList.push(node);
            node.children.forEach(n => tmpList.push(n));
        }
        //计算 total 属性
        while (nodeList.length > 1) {
            const node = nodeList.pop();
            if (node.parent) node.parent.total += node.total;
        }
    }

    /*** 
     * @param {object} profile
     * @description id -> node 节点映射
     */
    function buildIdToNodeMap(profile) {
        const idToNode = new Map();;
        const stack = [profile.resultRoot];
        //循环遍历
        while (stack.length) {
            const node = stack.pop();
            idToNode.set(node.id, node);
            stack.push.apply(stack, node.children);
        }
        //结果存入 _idToNode 属性
        profile._idToNode = idToNode;
    }

    /*** 
     * @param {object} profile
     * @description 找出 gc / program / idle 等属性
     */
    function extractMetaNodes(profile) {
        const topLevelNodes = profile.resultRoot.children;
        for (let i = 0; i < topLevelNodes.length && !(profile.gcNode && profile.programNode && profile.idleNode); i++) {
            const node = topLevelNodes[i];
            if (node.functionName === '(garbage collector)')
                profile.gcNode = node;
            else if (node.functionName === '(program)')
                profile.programNode = node;
            else if (node.functionName === '(idle)')
                profile.idleNode = node;
        }
    }

    /**
     * @param {function} openFrameCallback @param {function} closeFrameCallback
     * @param {object} profile
     * @description 计算出每个节点函数的真正耗费时长 
     */
    function forEachFrame(openFrameCallback, closeFrameCallback, profile) {
        //获取采样结果数组以及采样长度
        const samples = profile.samples;
        const samplesCount = samples.length;
        //获取采样时间戳数组
        const timestamps = profile.timestamps;
        //获取前面计算的 id -> node 映射关系 map
        const idToNode = profile._idToNode;
        //获取 gc 节点信息
        const gcNode = profile.gcNode;
        //调用栈记录
        const stackNodes = [];
        //记录栈顶层位置
        let stackTop = 0;

        //初始化部分默认值，前一个 sample 样本的最后一个节点默认为 root 节点
        let prevId = profile.resultRoot.id;
        let sampleTime = 0;
        let gcParentNode = null;

        //记录每一个节点的起始时间以及对应的 duration 时长
        const stackStartTimes = new Float64Array(profile.maxDepth + 2);
        const stackChildrenDuration = new Float64Array(profile.maxDepth + 2);

        for (let sampleIndex = 0, l = samplesCount; sampleIndex < l; sampleIndex++) {
            //当前采样样本对应的时间戳
            sampleTime = timestamps[sampleIndex];
            //当前采样的 id，其实就是遍历到的树对应的 id
            const id = samples[sampleIndex];
            //前后节点一致了，说明有长 cpu 运算跨 sample ，继续判断下一个 sample
            if (id === prevId) continue;
            //获取当前采样得到的函数调用栈的最后一个 node 节点
            let node = idToNode.get(id);
            //前一个 sample 对应的调用栈信息中的最后一个 node 节点
            let prevNode = idToNode.get(prevId);

            if (node === gcNode) {
                //GC 的样本是没有调用栈记录的，所以讲 GC 样本的父节点，认为是上一个样本对应栈信息的最顶层
                gcParentNode = prevNode;
                openFrameCallback(gcParentNode.depth + 1, gcNode, sampleTime);
                stackStartTimes[++stackTop] = sampleTime;
                stackChildrenDuration[stackTop] = 0;
                prevId = id;
                continue;
            }
            if (prevNode === gcNode) {
                //GC 帧的结束
                const start = stackStartTimes[stackTop];
                //耗费时长为当前样本时间戳 - 起始时间戳
                const duration = sampleTime - start;
                stackChildrenDuration[stackTop - 1] += duration;
                closeFrameCallback(gcParentNode.depth + 1, gcNode, start, duration, duration - stackChildrenDuration[stackTop]);
                --stackTop;
                prevNode = gcParentNode;
                prevId = prevNode.id;
                gcParentNode = null;
            }

            //当前样本的最后一个节点的深度 > 前一个样本的最后一个节点的深度，则一直循环直到找到调用栈深度小于前一个样本的最后一个节点深度为止
            while (node.depth > prevNode.depth) {
                stackNodes.push(node);
                //因为本节点已经 push 进去了，重新赋值为父节点
                node = node.parent;
            }

            while (prevNode !== node) {
                //上面的 while 循环可以保证 prevNode 和 node 有共同的父节点，因此可以计算本函数栈的调用时间开销
                const start = stackStartTimes[stackTop];
                const duration = sampleTime - start;
                //栈的上一级 duration 加入本层的 duration
                stackChildrenDuration[stackTop - 1] += duration;

                //调用回调函数，记录节点信息
                closeFrameCallback(prevNode.depth, prevNode, start, duration, (duration - stackChildrenDuration[stackTop]));
                --stackTop;
                if (node.depth === prevNode.depth) {
                    stackNodes.push(node);
                    node = node.parent;
                }
                prevNode = prevNode.parent;
            }

            while (stackNodes.length) {
                //取出最后一个节点，其实就是栈顶
                node = stackNodes.pop();
                //?
                openFrameCallback();
                //记录本节点的起始时间戳
                stackStartTimes[++stackTop] = sampleTime;
                //初始化本节点的 duration
                stackChildrenDuration[stackTop] = 0;
            }

            //循环结束重置 prevId，即本 sample 对应的最后一个节点成为下一个 sample 的前一个节点
            prevId = id;
        }

        //此时 prevId 对应整个 profiling 期间得到的最后一个样本的最后一个节点
        if (idToNode.get(prevId) === gcNode) {
            const start = stackStartTimes[stackTop];
            const duration = sampleTime - start;
            stackChildrenDuration[stackTop - 1] += duration;
            closeFrameCallback(gcParentNode.depth + 1, node, start, duration, duration - stackChildrenDuration[stackTop]);
            --stackTop;
        }

        for (let node = idToNode.get(prevId); node.parent; node = node.parent) {
            //加入最后一个节点的数据信息
            const start = stackStartTimes[stackTop];
            const duration = sampleTime - start;
            stackChildrenDuration[stackTop - 1] += duration;
            //保存结果
            closeFrameCallback(node.depth, node, start, duration, (duration - stackChildrenDuration[stackTop]));
            --stackTop;
        }
    }

    /**
     * @param {object} profile
     * @description 计算出各个函数执行片的 totle 时长
     */
    function calculateTotle(profile) {
        const entries = [];
        const stack = [];
        let maxDepth = 5;

        /**
         * @description 内部方法，构造调用栈
         */
        function _onOpenFrame() {
            stack.push(entries.length);
            entries.push(null);
        }

        /**
         * @param {number} depth @param {object} node 
         * @param {number} startTime @param {number} totalTime @param {number} selfTime 
         * @description 内部方法，构造调用栈结束后回调处理
         */
        function _onCloseFrame(depth, node, startTime, totalTime, selfTime) {
            const index = stack.pop();
            entries[index] = { depth, totalTime, startTime, selfTime, node };
            maxDepth = Math.max(maxDepth, depth);
        }

        //进入每一个函数调用栈处理
        forEachFrame(_onOpenFrame, _onCloseFrame, profile);

        //删除临时数据，并且将所需的数据回传
        profile.root = profile.resultRoot;
        profile.total = profile.profileEndTime - profile.profileStartTime;
        Object.keys(profile).forEach(key => key !== 'root' && key !== 'total' && delete profile[key]);
        profile.entries = entries;
    }

    /**
     * @param {object} profile @param {number} timeout @param {number} limit @param {function} filter
     * @description 计算出结果需要的结果
     */
    function fetchResult(profile, timeout, limit, filter) {
        //临时缓存对象
        const totalTimeCache = new Map();
        const executeCache = {};
        const bailoutCache = {};

        //初始化 total time 缓存
        totalTimeCache.set(`${profile.root.functionName}::@${profile.root.id}`, [profile.total]);

        //组装结果
        const result = {
            longFunctions: [],
            topExecutingFunctions: [],
            bailoutFunctions: []
        };
        const entries = profile.entries;

        //获取数据
        entries.forEach(entry => {
            //获取一些节点信息
            const node = entry.node;
            const funcName = node.functionName;
            const duration = entry.totalTime / 1000;
            const bailoutReason = node.bailoutReason;
            const url = node.url && `(${node.url} ${node.lineNumber})` || `(${node.lineNumber})`;

            //缓存每一个父节点的耗费时长
            const durationKey = `${funcName}::@${node.id}`;
            const durationList = totalTimeCache.get(durationKey);
            if (!durationList) totalTimeCache.set(durationKey, [duration]);
            else {
                durationList.push(duration);
                totalTimeCache.set(durationKey, durationList);
            }

            //过滤掉的数据，等到父节点信息设置完毕后再启用过滤函数
            if (!filter(url, funcName)) return;

            //过滤出运算时长数据
            const key = `${funcName}::${node.id}`;
            if (executeCache[key]) {
                executeCache[key].hitTimes += 1;
                executeCache[key].execTime += duration;
            } else {
                executeCache[key] = { funcName, execTime: duration, url, hitTimes: 1, node }
            }

            //过滤出逆优化数据
            if (bailoutReason) {
                //组装缓存 key
                const key = `${funcName}::${bailoutReason}::${url}`;
                if (bailoutCache[key]) {
                    bailoutCache[key].hitTimes += 1;
                } else {
                    bailoutCache[key] = { funcName, bailoutReason, url, hitTimes: 1 };
                }
            }
        });

        //计算一下父子节点占比
        const timeList = Object.keys(executeCache).map(key => {
            const executeMessage = executeCache[key];
            const node = executeMessage.node;
            const parent = node.parent && node.parent.functionName || 'unknown';
            const id = node.parent && Number(node.parent.id);
            executeMessage.parent = parent;
            executeMessage.id = id;
            const parentDurationList = totalTimeCache.get(`${parent}::@${id}`) || 0;
            executeMessage.execTimeAll = executeMessage.execTime;
            executeMessage.execTime = executeMessage.execTime / executeMessage.hitTimes;
            //父函数可能多次调用子函数
            const parentDuration = Array.isArray(parentDurationList) && parentDurationList.length && parentDurationList.reduce((acc, p) => acc + Number(p), 0) / executeMessage.hitTimes || 0;
            executeMessage.percentage = `${(parentDuration && ((executeMessage.execTime / parentDuration) * 100).toFixed(2))}` || '-';
            //删除 node 节点
            delete executeMessage.node;
            return executeMessage;
        }).sort((o, n) => Number(o.execTime) < Number(n.execTime) || Number(o.execTime) === Number(n.execTime) && Number(o.id) > Number(n.id) ? 1 : -1);
        //组装 long function，依照时间降序排列
        result.longFunctions = timeList.filter(item => item.execTime > Number(timeout)).filter((item, index) => index < Number(limit.long));
        //组装 top function，依照时间降序排列
        result.topExecutingFunctions = timeList.filter((item, index) => index < Number(limit.top));
        //组装 bailout 数据，按照命中次数降序排列
        result.bailoutFunctions = Object.keys(bailoutCache).map(key => bailoutCache[key]).sort((o, n) => Number(o.hitTimes) < Number(n.hitTimes) ? 1 : -1).filter((item, index) => index < Number(limit.bail));;

        return result;
    }

    /**
     * @param {object} profile @param {number} timeout  @param {object} limit @param {function} filter
     * @return {Promise}
     * @description 获取 CPU Profile 解析结果
     */
    function fetchCPUProfileP(profile, timeout, limit, filter) {
        //取出辅助参数
        const options = this.params;
        //返回一个 Promise 实例，可扩展性更强
        return co(_fetch);

        /**
         * @description 内部方法，发送计算结果的中间状态
         */
        function _sendFetchProgressP(msg) {
            const cb = options.callback;
            const params = options.params.apply(options, [msg, Date.now()]);
            return cb(params.message, params.socket);
        }

        /**
         * @description 内部方法，具体处理解析 profile 数据的逻辑
         */
        function* _fetch() {
            /** 简单兼容性校验 */
            profile = typeof profile === 'object' && profile || utils.jsonParse(profile);
            limit = typeof limit === 'object' && limit || { long: 5, top: 5, bail: 5 };
            timeout = !isNaN(timeout) && timeout || 200;
            filter = typeof filter === 'function' && filter || function (path, file) { return true }
            //无 head 节点直接 reject 掉
            if (!profile['head']) return 'Illegal CPU Profiler!';

            /** 以下对采集到的 CPU 数据进行分析 */
            //1. 初始化数据
            yield _sendFetchProgressP({ prefix: `进入分析函数`, suffix: `准备开始初始化 Attribution...` });
            initAttribution(profile);
            //2. 扁平化树结构
            yield _sendFetchProgressP({ prefix: `初始化 Attribution 完毕`, suffix: `准备开始扁平化 HeadNodes...` });
            flatHeadNodes(profile);
            //3. 遍历出从根节点起始的树结构
            yield _sendFetchProgressP({ prefix: `扁平化 HeadNodes 完毕`, suffix: `准备开始创建 HeadTree...` });
            createHeadTree(profile);
            //4. 计算父子节点关系以及深度树深度
            yield _sendFetchProgressP({ prefix: `创建 HeadTree 完毕`, suffix: `准备开始构建 ParentAndDepth...` });
            buildParentAndDepth(profile);
            //5. 计算各个节点的 total 属性
            yield _sendFetchProgressP({ prefix: `构建 ParentAndDepth 完毕`, suffix: `准备开始构建 Totals...` });
            buildTotals(profile);
            //6. 获取 id -> node 映射关系
            yield _sendFetchProgressP({ prefix: `构建 Totals 完毕`, suffix: `准备开始构建 IdToNodeMap...` });
            buildIdToNodeMap(profile);
            //7. 找出 gc / program / idle 等节点
            yield _sendFetchProgressP({ prefix: `构建 IdToNodeMap 完毕`, suffix: `准备开始找出 GC / Program / Idle 节点信息...` });
            extractMetaNodes(profile)
            //8. 计算出真正的 totle 时间
            yield _sendFetchProgressP({ prefix: `GC / Program / Idle 节点信息定位完毕`, suffix: `准备开始计算真正的函数执行耗费...` });
            calculateTotle(profile);

            /** 过滤出所需要的数据 */
            yield _sendFetchProgressP({ prefix: `真正的函数执行耗费计算完毕`, suffix: `准备开始过滤出分析结果...` });
            const result = fetchResult(profile, timeout, limit, filter);
            //清除数据
            profile = null;
            yield _sendFetchProgressP({ prefix: `Performance 所有分析完成` }, true);
            return result;
        }
    }

    return { fetchCPUProfileP }
};


