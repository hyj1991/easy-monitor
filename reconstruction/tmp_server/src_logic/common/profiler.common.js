'use strict';
const v8Profiler = require('v8-profiler');
const analysisLib = require('v8-analytics');

module.exports = function (_common, config, logger, utils) {
    /**
     * @param {array} nodes @param {string} key @param {string} value 
     * @description 找到指定 index 的节点
     */
    function catchNode(nodes, key, value) {
        return nodes.filter(item => Number(item[key]) === Number(value))[0];
    }

    /**
     * @param {array} arraySource @param {string} type @param {string} value @param {function} cb
     * @description 内部方法，对获取到的节点进行回调函数注入处理
     */
    function _findNode(arraySource, type, value, cb) {
        arraySource.forEach(item => {
            if (item[type] === value) {
                cb(item);
            }
        })
    }

    /**
     * @param {object} heapUsed @param {object} heapMap @param {array} leakPoint
     * @return {object}
     * @description 解析出引力图所需的数据结构
     */
    function createForceGraph(heapUsed, heapMap, leakPoint) {
        //开始进行逻辑处理
        let forceGraphAll = {};
        let leakPointLength = leakPoint.length;
        for (let i = 0; i < leakPointLength; i++) {
            let leak = leakPoint[i];
            let forceGraph = { nodes: [], links: [] };

            let biggestList = {};
            let isRecorded = {};
            let distanceDisplay = 1;
            let distanceLimit = 30;
            let childrenLimit = 5;
            let leakDistanceLimit = 8;

            let leakIndexList = [leak.index];
            let rootDistance = heapMap[leak.index].distance;
            biggestList[leak.index] = { id: heapMap[leak.index].id, source: null, retainedSize: heapMap[leak.index].retainedSize };

            while (leakIndexList.length !== 0 && distanceDisplay <= distanceLimit) {
                let tmpIndexArr = [];
                leakIndexList.forEach(index => {
                    let nodeDetail = heapMap[index];
                    let children = nodeDetail.children;

                    //tip: child's distance === parent.distance + 1
                    if (children.length > 100) children = children.slice(0, 100);
                    children = children.filter(item => Boolean(Number(heapMap[item.index].distance) === (1 + Number(nodeDetail.distance))));
                    children.sort((o, n) => Number(heapMap[o.index].retainedSize) < Number(heapMap[n.index].retainedSize) ? 1 : -1);
                    children = children.filter((item, index) => index < childrenLimit);

                    if (isRecorded[nodeDetail.id]) return;
                    isRecorded[nodeDetail.id] = true;

                    let isMain = Boolean(leak.index === Number(nodeDetail.index));

                    let size = 30, category = 1, ignore = true, flag = true;
                    if (isMain) { size = 40; category = 0; ignore = false }

                    forceGraph.nodes.push({
                        index: nodeDetail.index,
                        name: nodeDetail.id,
                        attributes: { isMain },
                        id: nodeDetail.id,
                        size,
                        category,
                        ignore,
                        flag
                    });

                    children.forEach((child, index) => {
                        let cIndex = child.index;
                        let childDetail = heapMap[cIndex];

                        if (!isRecorded[childDetail.id]) {
                            tmpIndexArr.push(cIndex);
                        }

                        //TODO, filter reason
                        if (Math.abs(rootDistance - childDetail.distance) < leakDistanceLimit && biggestList[nodeDetail.index] && childDetail.retainedSize / biggestList[nodeDetail.index].retainedSize > (1 / childrenLimit)) {
                            biggestList[cIndex] = { id: childDetail.id, source: nodeDetail.index, sourceId: nodeDetail.id, distance: childDetail.distance, retainedSize: childDetail.retainedSize };
                        }

                        if (distanceDisplay === distanceLimit) {
                            if (isRecorded[childDetail.id]) return;
                            isRecorded[childDetail.id] = true;

                            let size = 30, category = 1, ignore = true, flag = true;
                            if (distanceDisplay === 2) { ignore = false }

                            forceGraph.nodes.push({
                                index: childDetail.index,
                                name: childDetail.id,
                                attributes: {},
                                id: childDetail.id,
                                size,
                                category,
                                ignore,
                                flag
                            });
                        }

                        forceGraph.links.push({
                            source: nodeDetail.id,
                            target: childDetail.id,
                            sourceIndex: nodeDetail.index,
                            targetIndex: childDetail.index,
                            name_or_index: child.name_or_index
                        });
                    });
                });

                distanceDisplay++;
                leakIndexList = tmpIndexArr;
            }

            forceGraph.nodes.forEach(item => {
                heapUsed[item.index] = heapMap[item.index];
            });

            Object.keys(biggestList).forEach(index => {
                let data = catchNode(forceGraph.nodes, 'index', index);
                if (data) {
                    setExpandOff(forceGraph, data);
                }
            });

            forceGraph.nodes.forEach(function (node) {
                node.label = node.name;
                node.symbolSize = node.size;
            });

            const leakDetailTmp = heapMap[leak.index];
            forceGraphAll[`${leakDetailTmp.name}::${leakDetailTmp.id}`] = forceGraph;
        }

        return forceGraphAll;
    }

    /**
     * @param {object} forceGraph @param {object} data
     * @description echarts2 设置点击  展开 / 关闭 操作
     */
    function setExpandOff(forceGraph, data) {
        let nodesOption = forceGraph.nodes;
        let linksOption = forceGraph.links;
        let linksNodes = [];

        if (data.flag) {
            for (let m in linksOption) {
                if (linksOption[m].source == data.id) {
                    linksNodes.push(linksOption[m].target);
                }
            }
            if (linksNodes != null && linksNodes != undefined) {
                for (let p in linksNodes) {
                    _findNode(nodesOption, 'id', linksNodes[p], node => {
                        node.ignore = false;
                        node.flag = true;
                    });
                }
            }
            _findNode(nodesOption, 'id', data.id, node => {
                node.ignore = false;
                node.flag = false;
                node.category = 0;
            });
        } else {
            for (let m in linksOption) {
                if (linksOption[m].source == data.id) {
                    linksNodes.push(linksOption[m].target);
                }
                if (linksNodes != null && linksNodes != undefined) {
                    for (let n in linksNodes) {
                        if (linksOption[m].source == linksNodes[n] && linksOption[m].target != data.id) {
                            linksNodes.push(linksOption[m].target);
                        }
                    }
                }
            }

            if (linksNodes != null && linksNodes != undefined) {
                for (let p in linksNodes) {
                    _findNode(nodesOption, 'id', linksNodes[p], node => {
                        node.ignore = true;
                        node.flag = true;
                    });
                }
            }

            _findNode(nodesOption, 'id', data.id, node => {
                node.ignore = true;
                node.flag = true;
                node.category = 1;
            });
        }
    }

    /**
     * @param {object} heapUsed @param {object} heapMap @param {array} leakPoint @param {number} rootIndex 
     * @description 根据上述方法，计算出最终的 force-graph 引力图计算所需数据
     */
    function memCalculator(heapUsed, heapMap, leakPoint, rootIndex) {
        const forceGraph = createForceGraph(heapUsed, heapMap, leakPoint);
        const searchList = [{ index: rootIndex }].concat(leakPoint)
        return { forceGraph, searchList };
    }

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
     * @param {object} params 
     * @description 根据操作类型执行对应的 profiling 操作
     */
    function profilerP(opt, params) {
        params = params || {};
        if (opt === 'cpu') return cpuProfilerP(params.title);
        if (opt === 'mem') return memProfilerP();
    }

    /**
     * @param {string} title
     * @description 进行 cpu profiling 操作
     */
    function cpuProfilerP(title) {
        return new Promise(resolve => {
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
     * @description 进行 memory profiling 操作
     */
    function memProfilerP() {
        return new Promise((resolve, reject) => {
            const snapshot = v8Profiler.takeSnapshot();
            snapshot.export(function (error, result) {
                if (error) return reject(error);
                result = typeof result === 'object' && result || utils.jsonParse(result);
                resolve(result);
                snapshot.delete();
            });
        });
    }

    /**
     * @param {string} type @param {object} params @param {object} profiler
     * @description 对 profiling 得到的结果进行解析
     */
    function analyticsP(type, profiler, params) {
        return new Promise(resolve => {
            params = params || {};
            const result = {};

            //解析 cpu-profiler 操作结果
            if (type === 'cpu') {
                const optional = config.profiler.cpu.optional;
                result.timeout = params.timeout || optional.timeout;
                result.longFunctions = analysisLib(profiler, params.timeout || optional.timeout, false, true, { limit: params.long_limit || optional.long_limit }, config.profiler.filter_function);
                result.topExecutingFunctions = analysisLib(profiler, 1, false, true, { limit: params.top_limit || optional.top_limit }, config.profiler.filter_function);
                result.bailoutFunctions = analysisLib(profiler, null, true, true, { limit: params.bail_limit || optional.bail_limit }, config.profiler.filter_function);
            }

            //解析 mem-profiler 操作结果
            if (type === 'mem') {
                const memAnalytics = analysisLib.memAnalytics(profiler);
                const heapMap = memAnalytics.heapMap;
                const leakPoint = memAnalytics.leakPoint;
                const statistics = memAnalytics.statistics;
                const rootIndex = memAnalytics.rootIndex;
                const aggregates = memAnalytics.aggregates;
                const heapUsed = leakPoint.reduce((pre, next) => {
                    pre[next.index] = heapMap[next.index];
                    return pre;
                }, {});
                //加入 root 节点信息
                heapUsed[rootIndex] = heapMap[rootIndex];

                //获取最终分析结果
                const mem_data = memCalculator(heapUsed, heapMap, leakPoint, rootIndex);
                const forceGraph = mem_data.forceGraph;
                const searchList = mem_data.searchList.map(item => item.index);

                //将最终结果填充入结果对象中
                result.heapUsed = heapUsed;
                result.leakPoint = leakPoint;
                result.statistics = statistics;
                result.rootIndex = rootIndex;
                result.aggregates = aggregates;
                result.forceGraph = forceGraph;
                result.searchList = searchList;
            }

            resolve(result);
        });
    }

    return { template, composeKey, profilerP, analyticsP }
}