'use strict';
const co = require('co');
const stream = require('stream');
const JSONStream = require('JSONStream');

module.exports = function (_common, config, logger, utils, cache, common) {
    //参见 v8/include/v8-profiler.h
    const HeapGraphEdgeType = {
        kContextVariable: 0,  // A variable from a function context.
        kElement: 1,          // An element of an array.
        kProperty: 2,         // A named object property.
        kInternal: 3,         // A link that can't be accessed from JS, thus, its name isn't a real property name (e.g. parts of a ConsString).
        kHidden: 4,           // A link that is needed for proper sizes calculation, but may be hidden from user.
        kShortcut: 5,         // A link that must not be followed during sizes calculation.
        kWeak: 6              // A weak reference (ignored by the GC).
    };

    const HeapNodeType = {
        '(Internalized strings)': { type: 'kStringTable', not_gc_root: true, desc: '' },
        '(External strings)': { type: 'kExternalStringTable', not_gc_root: true, desc: '' },
        '(Smi roots)': { type: 'kSmiRootList', not_gc_root: true, desc: '' },
        '(Strong roots)': { type: 'kStrongRootList', not_gc_root: false, desc: 'js system object' },
        '(Internal string)': { type: 'kInternalizedString', not_gc_root: false, desc: 'js system object' },
        '(Bootstrapper)': { type: 'kBootstrapper', not_gc_root: false, desc: 'js system object' },
        '(Isolate)': { type: 'kTop', not_gc_root: false, desc: 'js local' },
        '(Relocatable)': { type: 'kRelocatable', not_gc_root: false, desc: 'js system object' },
        '(Debugger)': { type: 'kDebug', not_gc_root: false, desc: 'js system object' },
        '(Compilation cache)': { type: 'k(CompilationCache)', not_gc_root: false, desc: 'js system object' },
        '(Handle scope)': { type: 'kHandleScope', not_gc_root: false, desc: 'js binding local' },
        '(Builtins)': { type: 'kBuiltins', not_gc_root: false, desc: 'js system object' },
        '(Global handles)': { type: 'kGlobalHandles', not_gc_root: false, desc: 'js binding global' },
        '(Eternal handles)': { type: 'kEternalHandles', not_gc_root: false, desc: 'js binding global' },
        '(Thread manager)': { type: 'kThreadManager', not_gc_root: false, desc: 'js system object' },
        '(Strong roots)': { type: 'kStrongRoots', not_gc_root: false, desc: 'js system object' },
        '(Extensions)': { type: 'kExtensions', not_gc_root: false, desc: 'js system object' },
        '': { type: 'kUnidentified', not_gc_root: false, desc: 'unknown' }
    }

    /**
     * 序列化 heap 节点
     */
    function heapNodeSerialize(jsHeapSnapShot, index, limit, rootIndex) {
        let meta = jsHeapSnapShot._metaNode;
        let nodes = jsHeapSnapShot.nodes;
        let edges = jsHeapSnapShot.containmentEdges;
        let strings = jsHeapSnapShot.strings;
        let nodeFieldCount = jsHeapSnapShot._nodeFieldCount;
        let edgeFieldsCount = jsHeapSnapShot._edgeFieldsCount;
        let firstEdgeIndexes = jsHeapSnapShot._firstEdgeIndexes;
        let retainedSizeList = jsHeapSnapShot._retainedSizes;
        let distancesList = jsHeapSnapShot._nodeDistances;

        let nodeDetail = nodes.slice(index * nodeFieldCount, index * nodeFieldCount + nodeFieldCount);
        let edge_count = Number(nodeDetail[4]);
        let serialNode = {
            index: index,
            type: meta.node_types[0][nodeDetail[0]],
            name: strings[nodeDetail[1]],
            id: `@${nodeDetail[2]}`,
            trace_node_id: Number(nodeDetail[5]),
            children: [],
            retainedSize: Number(retainedSizeList[index]),
            distance: Number(distancesList[index])
        };

        let offset = firstEdgeIndexes[index];

        //更改处理逻辑，将所有数据缓存至 all 数组
        let all = [];
        //获取最大的节点信息
        let biggest = { index: 0, size: 0, _index: 0 };

        for (let i = 0; i < edge_count; i++) {
            let edgeDetail = edges.slice(offset, offset + edgeFieldsCount);

            let name_or_index = Boolean(Number(edgeDetail[0]) === Number(HeapGraphEdgeType.kElement) ||
                Number(edgeDetail[0]) === Number(HeapGraphEdgeType.kHidden)) ? `[${String(edgeDetail[1])}]` : `${strings[edgeDetail[1]]}`;

            let edge_index = edgeDetail[2] / nodeFieldCount;
            let retainedSize = Number(retainedSizeList[edge_index]);

            //简单判断出最大的节点
            if (biggest.size < retainedSize) {
                biggest.index = edge_index;
                biggest.size = retainedSize;
                biggest._index = i;
            }

            //缓存所有节点
            all.push({
                index: edge_index,
                name_or_index: name_or_index,
                to_node: `@${nodes[edgeDetail[2] + 2]}`,
                type: meta.edge_types[0][edgeDetail[0]]
            })

            offset += edgeFieldsCount;
        }

        //取出最大的节点，如果存在，则放入首位
        const big = all[biggest._index];
        big && serialNode.children.push(big);

        //有限制的情况下存储限制的节点数
        for (let i = 0, l = all.length; i < l; i++) {
            //最大的节点已经处理过
            if (i === biggest._index) continue;
            //只取出下一个节点
            // if (index !== rootIndex && (distancesList[all[i].index] - 1) !== distancesList[index]) continue;

            //有限制的情况仅仅存储 limit 个数的节点
            if (limit && index !== rootIndex) {
                //已经存储到了限制则跳出循环
                if (serialNode.children.length === limit) break;
            }

            //存储节点
            serialNode.children.push(all[i]);
        }

        return serialNode;
    }

    /**
     * 获取 jsHeapSnapShot & heapMap
     */
    function heapSnapShotCalculateP(heapData, options) {
        return co(_heapSnapShot, heapData, options)

        /**
         * 内部方法，具体处理逻辑
         */
        function* _heapSnapShot(heapData, options) {
            const jsHeapSnapShot = new common.worker.JSHeapSnapshot(heapData, {
                updateStatusP(msg, end) {
                    const cb = options.callback;
                    const params = options.params.apply(options, [msg, Date.now(), end]);
                    return cb(params.message, params.socket);
                },

                consoleWarn(str) {
                    // console.warn(str);
                }
            });
            //load data
            yield jsHeapSnapShot.initializeP();

            const needed = [`_statistics`, `_aggregates`, `_metaNode`, `nodes`, `containmentEdges`, `strings`, `_nodeFieldCount`, `_edgeFieldsCount`, `_firstEdgeIndexes`, `_retainedSizes`, `_nodeDistances`];
            //taken out
            Object.keys(jsHeapSnapShot).forEach(key => { if (!~needed.indexOf(key)) jsHeapSnapShot[key] = null; });
            //release heapData
            heapData = null;

            return jsHeapSnapShot;
        }
    }

    /**
     * 获取疑似泄漏点
     */
    function peakLeakPoint(jsHeapSnapShot, rootIndex, limit) {
        limit = limit || 5;
        let retainedSizeList = jsHeapSnapShot._retainedSizes;
        let root = heapNodeSerialize(jsHeapSnapShot, rootIndex);
        let strongRoots = null;
        for (let i = 0, e = root.children, l = e.length; i < l; i++) {
            const edgeType = e[i].type;
            if (edgeType === 'shortcut') {
                continue;
            }
            if (!strongRoots) {
                strongRoots = heapNodeSerialize(jsHeapSnapShot, e[i].index);
            }
        }

        let nodeToRootType = new Map();
        strongRoots.children.forEach(edge => {
            let node = heapNodeSerialize(jsHeapSnapShot, edge.index);
            let name = node.name;
            let ngr = true;
            if (!HeapNodeType[name]) {
                ngr = HeapNodeType[''].not_gc_root;
            } else {
                ngr = HeapNodeType[name].not_gc_root;
            }
            if (!ngr) {
                nodeToRootType.set(node, HeapNodeType[name] || HeapNodeType['']);
            }
        });

        let gcRootsList = [];
        nodeToRootType.forEach((v, k) => {
            k.children.forEach(e => {
                let node = heapNodeSerialize(jsHeapSnapShot, e.index);
                if (e.type === 'shortcut' || node.type === 'synthetic') {
                    throw new Error('v8 heapsnapshot parser error')
                }
                if (e.type === 'weak') {
                    return;
                }
                let rootName = null;
                // TODO: null_value 和 the_hole_value 后续处理
                gcRootsList.push({
                    index: node.index,
                    size: node.retainedSize
                });
            });
        });

        // 计算疑似泄漏点
        let leakPoint = gcRootsList.sort((o, n) => o.size < n.size ? 1 : -1).filter((g, i) => i < limit);
        return leakPoint
    }


    /*
     * 获取 heapsnapshot
    */
    function heapUsageP(heapData, options) {
        return co(_heap, heapData, options);

        /**
         * 内部处理逻辑
         */
        function* _heap(heapData, options) {
            options = options || {};

            const rootIndex = heapData.snapshot.root_index || 0;
            let jsHeapSnapShot = yield heapSnapShotCalculateP(heapData, options);
            let leakPoint = peakLeakPoint(jsHeapSnapShot, rootIndex, options.limit);

            return { leakPoint, jsHeapSnapShot, rootIndex };
        }
    }

    /**
     * @param {stream} transform @param {object} options 
     * @return {promise}
     */
    function fetchHeapUsageP(transform, options) {
        const isStream = Boolean(transform instanceof stream.Stream);

        return new Promise((resolve, reject) => {
            if (isStream) {
                const parser = JSONStream.parse();
                transform.pipe(parser);

                parser.on('data', heapData => {
                    const cb = options.callback;
                    const params = options.params.apply(options, [{ prefix: `Memory 流式数据准备完毕`, suffix: `准备开始构建 Edge Indexs` }, Date.now()]);
                    cb(params.message, params.socket).then(() => heapUsageP(heapData, options)).then(resolve).catch(reject);
                });

                parser.on('error', reject);
            } else {
                heapUsageP(transform, options).then(resolve).catch(reject);
            }
        });
    }

    return { fetchHeapUsageP, heapNodeSerialize };
}