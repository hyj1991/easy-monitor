'use strict';
const co = require('co');
const MAX_CACHE_DEPTH = 5;
/** 因为 v8-profiler 在 node 8.x 上有 bug，且官方响应太慢，故先行修复此 bug，
发布 v8-profiler-node8 作为临时方案，等到官方修复后再恢复官方版本 */
// const v8Profiler = require('v8-profiler');
const v8Profiler = require('v8-profiler-node8');
// const analysisLib = require('v8-analytics');

module.exports = function (_common, config, logger, utils, cache, common) {
    /**
     * @param {number} rootIndex @param {object} heapUsed @param {function} serialize
     * @description 加入从 root 节点开始的信息
     */
    // function addRootDisplay(rootIndex, heapUsed, serialize) {
    //     //root 节点展示的深度
    //     const distanceLimit = config.profiler.mem.optional.distance_root_limit;

    //     //下面开始计算节点属性
    //     let distanceDisplay = 1;
    //     let tmpList = [rootIndex]
    //     while (distanceDisplay < distanceLimit && tmpList.length) {
    //         const childList = []
    //         //将本深度全部收掉
    //         while (tmpList.length) {
    //             const index = tmpList.pop();
    //             //已经存储的过去丢弃
    //             if (heapUsed[index]) continue;
    //             const detail = serialize(index, Boolean(distanceDisplay < config.profiler.mem.optional.child_node_display));
    //             heapUsed[index] = detail;
    //             //保持 while 循环
    //             detail && Array.isArray(detail.children) && detail.children.forEach(item => childList.push(item.index));
    //         }

    //         //重置 tmpList 数据
    //         tmpList = childList;
    //         //深度 + 1
    //         distanceDisplay++;
    //     }
    // }

    /**
     * @param {array} nodes @param {string} key @param {string} value 
     * @description 找到指定 index 的节点
     */
    // function catchNode(nodes, key, value) {
    //     return nodes.filter(item => Number(item[key]) === Number(value))[0];
    // }

    /**
     * @param {HeapSnapshotWorker.JSHeapSnapshot} jsHeapSnapShot 
     * @param {number} limit
     * @description 柯里化，根据 jsHeapSnapShot 以及 index 的值计算出节点详细属性
     */
    // function serializeNode(jsHeapSnapShot, limit) {
    //     const _cache = {};

    //     /**
    //      * @param {number} index
    //      * @return {object}
    //      * @description 根据节点索引，得出节点详细信息
    //      */
    //     return function (index, need) {
    //         let cache = _cache[index];
    //         //已经计算过的数据缓存起来
    //         if (cache) return cache;
    //         //否则调用 serialize 函数序列化数据，并且缓存起来
    //         cache = common.heap.heapNodeSerialize(jsHeapSnapShot, index, limit, need);
    //         _cache[index] = cache;
    //         return cache;
    //     }
    // }

    /**
     * @param {object} heapUsed @param {function} serialize @param {array} leakPoint
     * @return {object}
     * @description 解析出引力图所需的数据结构
     */
    // function createForceGraph(heapUsed, serialize, leakPoint) {
    //     //开始进行逻辑处理
    //     let forceGraphAll = {};
    //     let leakPointLength = leakPoint.length;
    //     for (let i = 0; i < leakPointLength; i++) {
    //         let leak = leakPoint[i];
    //         let forceGraph = { nodes: [], links: [] };
    //         let forceMaps = {};

    //         let biggestList = {};
    //         let isRecorded = {};
    //         let distanceDisplay = 1;
    //         let distanceLimit = config.profiler.mem.optional.distance_limit;
    //         let childrenLimit = config.profiler.mem.optional.node_limit;
    //         let leakDistanceLimit = config.profiler.mem.optional.leak_limit;

    //         let leakIndexList = [leak.index];
    //         let rootDistance = serialize(leak.index).distance;
    //         biggestList[leak.index] = { id: serialize(leak.index).id, source: null, retainedSize: serialize(leak.index).retainedSize };

    //         while (leakIndexList.length !== 0 && distanceDisplay <= distanceLimit) {
    //             let tmpIndexArr = [];
    //             leakIndexList.forEach(index => {
    //                 let nodeDetail = serialize(index);
    //                 let children = nodeDetail.children;

    //                 //去除一部分老的逻辑，加速处理速度以及减小结果体积
    //                 //tip: child's distance === parent.distance + 1
    //                 // if (children.length > 100) children = children.slice(0, 100);
    //                 //root节点不过滤
    //                 children = children.filter(item => Boolean(Number(serialize(item.index).distance) === (1 + Number(nodeDetail.distance))));
    //                 // children.sort((o, n) => Number(serialize(o.index).retainedSize) < Number(serialize(n.index).retainedSize) ? 1 : -1);
    //                 // children = children.filter((item, index) => index < childrenLimit);

    //                 //如果该节点已经记录过，直接返回
    //                 if (isRecorded[nodeDetail.id]) return;
    //                 isRecorded[nodeDetail.id] = true;

    //                 //leakPoint 为根节点
    //                 let isMain = Boolean(leak.index === Number(nodeDetail.index));

    //                 //设置普通节点颜色和尺寸
    //                 let size = 30, category = 1, ignore = true, flag = true;
    //                 //主节点放大
    //                 if (isMain) { size = 40; category = 0; ignore = false }

    //                 //存储父节点信息
    //                 const father = {
    //                     index: nodeDetail.index,
    //                     name: nodeDetail.id,
    //                     attributes: { isMain },
    //                     id: nodeDetail.id,
    //                     size,
    //                     category,
    //                     ignore,
    //                     flag,
    //                     children: []
    //                 }
    //                 forceGraph.nodes.push(father);
    //                 forceMaps[nodeDetail.id] = father;

    //                 //处理父节点对应的子节点
    //                 children.forEach((child, index) => {
    //                     let cIndex = child.index;
    //                     let childDetail = serialize(cIndex);

    //                     //此节点未记录过
    //                     if (!isRecorded[childDetail.id]) {
    //                         tmpIndexArr.push(cIndex);
    //                         father.children.push(childDetail.id);
    //                     }

    //                     //TODO, filter reason
    //                     if (Math.abs(rootDistance - childDetail.distance) < leakDistanceLimit && biggestList[nodeDetail.index] && childDetail.retainedSize / biggestList[nodeDetail.index].retainedSize > (1 / childrenLimit)) {
    //                         biggestList[cIndex] = { id: childDetail.id, source: nodeDetail.index, sourceId: nodeDetail.id, distance: childDetail.distance, retainedSize: childDetail.retainedSize };
    //                     }

    //                     //最后一层数据加入
    //                     if (distanceDisplay === distanceLimit) {
    //                         if (isRecorded[childDetail.id]) return;
    //                         isRecorded[childDetail.id] = true;

    //                         let size = 30, category = 1, ignore = true, flag = true;
    //                         //遗留代码，错误屏蔽
    //                         // if (distanceDisplay === 2) { ignore = false }

    //                         let father = {
    //                             index: childDetail.index,
    //                             name: childDetail.id,
    //                             attributes: {},
    //                             id: childDetail.id,
    //                             size,
    //                             category,
    //                             ignore,
    //                             flag,
    //                             children: []
    //                         };

    //                         forceGraph.nodes.push(father);
    //                         forceMaps[childDetail.id] = father;
    //                     }

    //                     forceGraph.links.push({
    //                         source: nodeDetail.id,
    //                         target: childDetail.id,
    //                         sourceIndex: nodeDetail.index,
    //                         targetIndex: childDetail.index,
    //                         name_or_index: child.name_or_index
    //                     });
    //                 });
    //             });

    //             distanceDisplay++;
    //             leakIndexList = tmpIndexArr;
    //         }

    //         //将使用到的节点置入
    //         forceGraph.nodes.forEach(item => {
    //             heapUsed[item.index] = serialize(item.index);
    //         });

    //         //从最大引用节点开始展示一部分链条
    //         Object.keys(biggestList).forEach(index => {
    //             let data = catchNode(forceGraph.nodes, 'index', index);
    //             if (data) {
    //                 setExpandOff(forceGraph, forceMaps, data);
    //             }
    //         });

    //         //根据参数更新大小
    //         forceGraph.nodes.forEach(function (node) {
    //             node.label = node.name;
    //             node.symbolSize = node.size;
    //         });

    //         //增加 index 标识
    //         forceGraph.index = leak.index;

    //         //force graph 数据置入不同的 value 中
    //         const leakDetailTmp = serialize(leak.index);
    //         forceGraphAll[`${leakDetailTmp.name}::${leakDetailTmp.id}`] = forceGraph;
    //     }

    //     return forceGraphAll;
    // }

    /**
     * @param {object} forceGraph @param {object} forceMaps @param {object} data
     * @description echarts2 设置点击  展开 / 关闭 操作
     */
    // function setExpandOff(forceGraph, forceMaps, data) {
    //     let nodesOption = forceGraph.nodes;
    //     let linksOption = forceGraph.links;
    //     let linksNodes = [];
    //     //这里只可能是点击展开
    //     if (data.flag) {
    //         const father = forceMaps[data.id];
    //         //找出子节点的过程
    //         linksNodes = father.children;
    //         //将子节点设置为开启，只设置一层
    //         if (linksNodes != null && linksNodes != undefined) {
    //             //子节点设置开启
    //             linksNodes.forEach(link => {
    //                 const node = forceMaps[link];
    //                 node.ignore = false;
    //                 node.flag = true;
    //             });
    //         }

    //         //更改父节点状态
    //         father.flag = false;
    //         father.category = 0;
    //     }
    // }

    /**
     * @param {object} heapUsed @param {function} serialize @param {array} leakPoint @param
     * @description 根据上述方法，计算出最终的 force-graph 引力图计算所需数据
     */
    // function memCalculator(heapUsed, serialize, leakPoint) {
    //     const searchList = leakPoint;
    //     const forceGraph = createForceGraph(heapUsed, serialize, searchList);
    //     return { forceGraph, searchList };
    // }

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
     * @param {string} opt "cpu" 或者 "mem"
     * @param {object} params @param {boolean} notStream
     * @description 根据操作类型执行对应的 profiling 操作
     */
    function profilerP(opt, params, notStream) {
        params = params || {};
        if (opt === 'cpu') return cpuProfilerP(params, notStream);
        if (opt === 'mem') return memProfilerP(notStream);
    }

    /**
     * @param {object} params @param {boolean} notStream
     * @description 进行 cpu profiling 操作
     */
    function cpuProfilerP(params, notStream) {
        const title = params && params.title || '';
        const cb = params && params.callback;
        //定时检查
        const interval = setInterval(cb.bind(params), config.profiler.cpu.profiling_check_time);

        return new Promise(resolve => {
            v8Profiler.startProfiling(title, true);

            setTimeout(() => {
                const profiler = v8Profiler.stopProfiling(title);
                //成功后清除掉 interval 定时器
                clearInterval(interval);
                profiler.delete();
                resolve(profiler);
            }, config.profiler.cpu.profiling_time);
        })
    }

    /**
     * @param {boolean} notStream
     * @description 进行 memory profiling 操作
     */
    function memProfilerP(notStream) {
        return new Promise((resolve, reject) => {
            const snapshot = v8Profiler.takeSnapshot();

            //默认采用 stream 流式读取
            if (notStream) {
                //废弃方法，改用以下流式读取 heapsnapshot 方式对内存更加友好
                snapshot.export(function (error, result) {
                    if (error) return reject(error);
                    result = typeof result === 'object' && result || utils.jsonParse(result);
                    resolve(result);
                    snapshot.delete();
                });
            } else {
                //创建 transform 流
                const transform = snapshot.export();
                resolve(transform);
                //结束后删除
                transform.on('finish', snapshot.delete.bind(snapshot));
            }
        });
    }

    /**
     * @description 增加反馈节点信息
     */
    function addNodesImpl(heapUsed, parser) {
        return function (realId) {
            heapUsed[realId] = parser.serializeNode(realId);
            const edgeRealIds = []
            for (let edge of heapUsed[realId].edges) {
                const edgeName = parser.edgeUtil.getNameOrIndex(edge);
                const targetNode = parser.edgeUtil.getTargetNode(edge);
                const edgeRealId = parser.ordinalNode2realNode[targetNode];
                // edge 为已过滤的节点
                if (edgeRealId === -1) {
                    continue;
                }
                edgeRealIds.push({ realId: edgeRealId, edge: edgeName });
                // 没有缓存过的
                if (!heapUsed[edgeRealId]) {
                    heapUsed[edgeRealId] = parser.serializeNode(edgeRealId);
                }
            }
            // edgeRealIds.sort((o, n) => parser.serializeNode(o.realId).retainedSize < parser.serializeNode(n.realId).retainedSize ? 1 : -1);
            heapUsed[realId].edges = edgeRealIds;
        }
    }

    /**
     * @description 对 profiling 得到的结果进行解析
     */
    function analyticsP(type, profiler, params) {
        return co(_analysysG, type, profiler, params);

        /**
         * @param {string} type @param {object} params @param {object} profiler
         * @description 内部逻辑，处理 profiling 结果解析
         */
        function* _analysysG(type, profiler, params) {
            params = params || {};
            const result = {};

            //解析 cpu-profiler 操作结果
            if (type === 'cpu') {
                const optional = config.profiler.cpu.optional;
                result.timeout = params.timeout || optional.timeout;
                //老的逻辑，去除
                // result.longFunctions = analysisLib(profiler, params.timeout || optional.timeout, false, true, { limit: params.long_limit || optional.long_limit }, config.profiler.need_filter && config.profiler.filter_function);
                // result.topExecutingFunctions = analysisLib(profiler, 1, false, true, { limit: params.top_limit || optional.top_limit }, config.profiler.need_filter && config.profiler.filter_function);
                // result.bailoutFunctions = analysisLib(profiler, null, true, true, { limit: params.bail_limit || optional.bail_limit }, config.profiler.need_filter && config.profiler.filter_function);

                //优化后的新逻辑，已经是老逻辑了，再去除
                const timeout = params.timeout || optional.timeout;
                const limit = { long: params.long_limit || optional.long_limit, top: params.top_limit || optional.top_limit, bail: params.bail_limit || optional.bail_limit };
                const filter = config.profiler.need_filter && config.profiler.filter_function;
                // const resultProfiler = yield common.performance.fetchCPUProfileP.apply({ params }, [profiler, timeout, limit, filter]);
                // result.longFunctions = resultProfiler.longFunctions;
                // result.topExecutingFunctions = resultProfiler.topExecutingFunctions;
                // result.bailoutFunctions = resultProfiler.bailoutFunctions;

                // 再次优化 cpu 日志分析算法
                const parsed = common.flamegraph.fetchSvgRenderContext(profiler, limit, filter);
                result.topExecutingFunctions = parsed.top;
                result.bailoutFunctions = parsed.bail;
                result.flamegraphData = parsed.flamegraph;
            }

            //解析 mem-profiler 操作结果
            if (type === 'mem') {
                params.limit = config.profiler.mem.optional.node_limit;
                // 去除 v8-analytics 依赖
                // const memAnalytics = yield analysisLib.memAnalyticsP(profiler, params);
                // 后面会彻底去除此算法
                // const memAnalytics = yield common.heap.fetchHeapUsageP.call({ common }, profiler, params);
                // 引入新的算法，以后优化的方向
                const parser = yield common.parser.fetchParserP(profiler, params);

                //取出分析结果
                // 注意 leakPoint 保存的是泄漏起始点的 realId
                const heapUsed = {};
                const addNodes = addNodesImpl(heapUsed, parser);
                const leakPoints = parser.topDominator.filter((item, index) => index < config.profiler.mem.optional.leakpoint_limit);
                const leakMaps = leakPoints.map(point => {
                    let nowCacheDepth = 0;
                    let leakMapList = parser.getLeakMap(point);
                    if (!leakMapList.length) return;
                    let needCacheNodesRealIdList = [leakMapList[leakMapList.length - 1].realId];
                    while (nowCacheDepth < MAX_CACHE_DEPTH && needCacheNodesRealIdList.length > 0) {
                        let tmp = [];
                        nowCacheDepth++;
                        for (let needCacheNodeRealId of needCacheNodesRealIdList) {
                            // 缓存本节点
                            addNodes(needCacheNodeRealId);
                            // 加入子节点
                            let needCacheNode = parser.serializeNode(needCacheNodeRealId);
                            for (let edge of needCacheNode.edges) {
                                const targetNode = parser.edgeUtil.getTargetNode(edge);
                                const edgeRealId = parser.ordinalNode2realNode[targetNode];
                                // edge 为已过滤的节点
                                if (edgeRealId === -1) {
                                    continue;
                                }
                                tmp.push(edgeRealId);
                            }
                        }
                        needCacheNodesRealIdList = tmp;
                    }

                    return leakMapList.map((m, i, a) => {
                        addNodes(m.realId);
                        if (a.length === 1) {
                            return { source: m.realId };
                        }
                        if (a[i + 1]) {
                            addNodes(a[i + 1].realId);
                            return {
                                source: m.realId,
                                target: a[i + 1].realId,
                                edge: a[i + 1].edge && parser.serializeEdge(a[i + 1].edge).nameOrIndex || false
                            }
                        }
                        return false;
                    }).filter(item => item);
                });

                // rootIndex 对应的是 ordinal id
                const rootIndex = parser.rootNodeIndex;
                result.leakPoint = leakPoints;
                result.leakMaps = leakMaps;
                result.heapUsed = heapUsed;
                result.statistics = parser.statistics;
                return result;

                // 去除旧逻辑
                // //根据分析结果初步计算属性
                // const statistics = jsHeapSnapShot._statistics;
                // const aggregates = jsHeapSnapShot._aggregates.allObjects;

                // //节点计算柯里化函数
                // const serialize = serializeNode(jsHeapSnapShot, config.profiler.mem.optional.node_limit);

                // //TODO
                // // const heapUsed = leakPoint.reduce((pre, next) => {
                // //     pre[next.index] = serialize(next.index);
                // //     return pre;
                // // }, {});

                // //如果配置打开了 root 节点信息加入 root 节点起始的信息
                // const needRoot = Boolean(config.profiler.mem.optional.need_root);
                // needRoot && addRootDisplay(rootIndex, heapUsed, serialize);

                // //获取最终分析结果
                // const mem_data = memCalculator(heapUsed, serialize, leakPoint);
                // const forceGraph = mem_data.forceGraph;
                // const searchList = mem_data.searchList.map(item => item.index);

                // //释放 jsHeapSnapShot 对象
                // jsHeapSnapShot = null;

                // //将最终结果填充入结果对象中
                // result.heapUsed = heapUsed;
                // result.leakPoint = leakPoint;
                // result.statistics = statistics;
                // result.rootIndex = rootIndex;
                // result.aggregates = aggregates;
                // result.forceGraph = forceGraph;
                // result.searchList = searchList;
            }

            return result;
        }
    }

    return { template, composeKey, profilerP, analyticsP }
}