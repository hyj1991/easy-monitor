'use strict';
const co = require('co');

module.exports = function (_common, config, logger, utils, cache, common) {
    const HeapSnapshotWorker = {};

    /**
     * @interface
     */
    HeapSnapshotWorker.HeapSnapshotItem = function () {
    };

    HeapSnapshotWorker.HeapSnapshotItem.prototype = {
        /**
         * @return {number}
         */
        itemIndex() {
        },

        /**
         * @return {!Object}
         */
        serialize() {
        }
    };

    /**
     * @implements {HeapSnapshotWorker.HeapSnapshotItem}
     * @unrestricted
     */
    HeapSnapshotWorker.HeapSnapshotEdge = class {
        /**
         * @param {!HeapSnapshotWorker.HeapSnapshot} snapshot
         * @param {number=} edgeIndex
         */
        constructor(snapshot, edgeIndex) {
            this._snapshot = snapshot;
            this._edges = snapshot.containmentEdges;
            this.edgeIndex = edgeIndex || 0;
        }

        /**
         * @return {!HeapSnapshotWorker.HeapSnapshotEdge}
         */
        clone() {
            return new HeapSnapshotWorker.HeapSnapshotEdge(this._snapshot, this.edgeIndex);
        }

        /**
         * @return {boolean}
         */
        hasStringName() {
            throw new Error('Not implemented');
        }

        /**
         * @return {string}
         */
        name() {
            throw new Error('Not implemented');
        }

        /**
         * @return {!HeapSnapshotWorker.HeapSnapshotNode}
         */
        node() {
            return this._snapshot.createNode(this.nodeIndex());
        }

        /**
         * @return {number}
         */
        nodeIndex() {
            return this._edges[this.edgeIndex + this._snapshot._edgeToNodeOffset];
        }

        /**
         * @override
         * @return {string}
         */
        toString() {
            return 'HeapSnapshotEdge: ' + this.name();
        }

        /**
         * @return {string}
         */
        type() {
            return this._snapshot._edgeTypes[this.rawType()];
        }

        /**
         * @override
         * @return {number}
         */
        itemIndex() {
            return this.edgeIndex;
        }

        /**
         * @override
         * @return {!common.model.Edge}
         */
        serialize() {
            return new common.model.Edge(this.name(), this.node().serialize(), this.type(), this.edgeIndex);
        }

        /**
         * @protected
         * @return {number}
         */
        rawType() {
            return this._edges[this.edgeIndex + this._snapshot._edgeTypeOffset];
        }
    };

    /**
     * @interface
     */
    HeapSnapshotWorker.HeapSnapshotItemIterator = function () {
    };

    HeapSnapshotWorker.HeapSnapshotItemIterator.prototype = {
        /**
         * @return {boolean}
         */
        hasNext() {
        },

        /**
         * @return {!HeapSnapshotWorker.HeapSnapshotItem}
         */
        item() {
        },

        next() {
        }
    };

    /**
     * @interface
     */
    HeapSnapshotWorker.HeapSnapshotItemIndexProvider = function () {
    };

    HeapSnapshotWorker.HeapSnapshotItemIndexProvider.prototype = {
        /**
         * @param {number} newIndex
         * @return {!HeapSnapshotWorker.HeapSnapshotItem}
         */
        itemForIndex(newIndex) {
        },
    };

    /**
     * @implements {HeapSnapshotWorker.HeapSnapshotItemIndexProvider}
     * @unrestricted
     */
    HeapSnapshotWorker.HeapSnapshotNodeIndexProvider = class {
        /**
         * @param {!HeapSnapshotWorker.HeapSnapshot} snapshot
         */
        constructor(snapshot) {
            this._node = snapshot.createNode();
        }

        /**
         * @override
         * @param {number} index
         * @return {!HeapSnapshotWorker.HeapSnapshotNode}
         */
        itemForIndex(index) {
            this._node.nodeIndex = index;
            return this._node;
        }
    };

    /**
     * @implements {HeapSnapshotWorker.HeapSnapshotItemIndexProvider}
     * @unrestricted
     */
    HeapSnapshotWorker.HeapSnapshotEdgeIndexProvider = class {
        /**
         * @param {!HeapSnapshotWorker.HeapSnapshot} snapshot
         */
        constructor(snapshot) {
            this._edge = snapshot.createEdge(0);
        }

        /**
         * @override
         * @param {number} index
         * @return {!HeapSnapshotWorker.HeapSnapshotEdge}
         */
        itemForIndex(index) {
            this._edge.edgeIndex = index;
            return this._edge;
        }
    };

    /**
     * @implements {HeapSnapshotWorker.HeapSnapshotItemIndexProvider}
     * @unrestricted
     */
    HeapSnapshotWorker.HeapSnapshotRetainerEdgeIndexProvider = class {
        /**
         * @param {!HeapSnapshotWorker.HeapSnapshot} snapshot
         */
        constructor(snapshot) {
            this._retainerEdge = snapshot.createRetainingEdge(0);
        }

        /**
         * @override
         * @param {number} index
         * @return {!HeapSnapshotWorker.HeapSnapshotRetainerEdge}
         */
        itemForIndex(index) {
            this._retainerEdge.setRetainerIndex(index);
            return this._retainerEdge;
        }
    };

    /**
     * @implements {HeapSnapshotWorker.HeapSnapshotItemIterator}
     * @unrestricted
     */
    HeapSnapshotWorker.HeapSnapshotEdgeIterator = class {
        /**
         * @param {!HeapSnapshotWorker.HeapSnapshotNode} node
         */
        constructor(node) {
            this._sourceNode = node;
            this.edge = node._snapshot.createEdge(node.edgeIndexesStart());
        }

        /**
         * @override
         * @return {boolean}
         */
        hasNext() {
            return this.edge.edgeIndex < this._sourceNode.edgeIndexesEnd();
        }

        /**
         * @override
         * @return {!HeapSnapshotWorker.HeapSnapshotEdge}
         */
        item() {
            return this.edge;
        }

        /**
         * @override
         */
        next() {
            this.edge.edgeIndex += this.edge._snapshot._edgeFieldsCount;
        }
    };

    /**
     * @implements {HeapSnapshotWorker.HeapSnapshotItem}
     * @unrestricted
     */
    HeapSnapshotWorker.HeapSnapshotRetainerEdge = class {
        /**
         * @param {!HeapSnapshotWorker.HeapSnapshot} snapshot
         * @param {number} retainerIndex
         */
        constructor(snapshot, retainerIndex) {
            this._snapshot = snapshot;
            this.setRetainerIndex(retainerIndex);
        }

        /**
         * @return {!HeapSnapshotWorker.HeapSnapshotRetainerEdge}
         */
        clone() {
            return new HeapSnapshotWorker.HeapSnapshotRetainerEdge(this._snapshot, this.retainerIndex());
        }

        /**
         * @return {boolean}
         */
        hasStringName() {
            return this._edge().hasStringName();
        }

        /**
         * @return {string}
         */
        name() {
            return this._edge().name();
        }

        /**
         * @return {!HeapSnapshotWorker.HeapSnapshotNode}
         */
        node() {
            return this._node();
        }

        /**
         * @return {number}
         */
        nodeIndex() {
            return this._retainingNodeIndex;
        }

        /**
         * @return {number}
         */
        retainerIndex() {
            return this._retainerIndex;
        }

        /**
         * @param {number} retainerIndex
         */
        setRetainerIndex(retainerIndex) {
            if (retainerIndex === this._retainerIndex)
                return;
            this._retainerIndex = retainerIndex;
            this._globalEdgeIndex = this._snapshot._retainingEdges[retainerIndex];
            this._retainingNodeIndex = this._snapshot._retainingNodes[retainerIndex];
            this._edgeInstance = null;
            this._nodeInstance = null;
        }

        /**
         * @param {number} edgeIndex
         */
        set edgeIndex(edgeIndex) {
            this.setRetainerIndex(edgeIndex);
        }

        _node() {
            if (!this._nodeInstance)
                this._nodeInstance = this._snapshot.createNode(this._retainingNodeIndex);
            return this._nodeInstance;
        }

        _edge() {
            if (!this._edgeInstance)
                this._edgeInstance = this._snapshot.createEdge(this._globalEdgeIndex);
            return this._edgeInstance;
        }

        /**
         * @override
         * @return {string}
         */
        toString() {
            return this._edge().toString();
        }

        /**
         * @override
         * @return {number}
         */
        itemIndex() {
            return this._retainerIndex;
        }

        /**
         * @override
         * @return {!common.model.Edge}
         */
        serialize() {
            return new common.model.Edge(this.name(), this.node().serialize(), this.type(), this._globalEdgeIndex);
        }

        /**
         * @return {string}
         */
        type() {
            return this._edge().type();
        }
    };

    /**
     * @implements {HeapSnapshotWorker.HeapSnapshotItemIterator}
     * @unrestricted
     */
    HeapSnapshotWorker.HeapSnapshotRetainerEdgeIterator = class {
        /**
         * @param {!HeapSnapshotWorker.HeapSnapshotNode} retainedNode
         */
        constructor(retainedNode) {
            let snapshot = retainedNode._snapshot;
            let retainedNodeOrdinal = retainedNode.ordinal();
            let retainerIndex = snapshot._firstRetainerIndex[retainedNodeOrdinal];
            this._retainersEnd = snapshot._firstRetainerIndex[retainedNodeOrdinal + 1];
            this.retainer = snapshot.createRetainingEdge(retainerIndex);
        }

        /**
         * @override
         * @return {boolean}
         */
        hasNext() {
            return this.retainer.retainerIndex() < this._retainersEnd;
        }

        /**
         * @override
         * @return {!HeapSnapshotWorker.HeapSnapshotRetainerEdge}
         */
        item() {
            return this.retainer;
        }

        /**
         * @override
         */
        next() {
            this.retainer.setRetainerIndex(this.retainer.retainerIndex() + 1);
        }
    };

    /**
     * @implements {HeapSnapshotWorker.HeapSnapshotItem}
     * @unrestricted
     */
    HeapSnapshotWorker.HeapSnapshotNode = class {
        /**
         * @param {!HeapSnapshotWorker.HeapSnapshot} snapshot
         * @param {number=} nodeIndex
         */
        constructor(snapshot, nodeIndex) {
            this._snapshot = snapshot;
            this.nodeIndex = nodeIndex || 0;
        }

        /**
         * @return {number}
         */
        distance() {
            return this._snapshot._nodeDistances[this.nodeIndex / this._snapshot._nodeFieldCount];
        }

        /**
         * @return {string}
         */
        className() {
            throw new Error('Not implemented');
        }

        /**
         * @return {number}
         */
        classIndex() {
            throw new Error('Not implemented');
        }

        /**
         * @return {number}
         */
        dominatorIndex() {
            let nodeFieldCount = this._snapshot._nodeFieldCount;
            return this._snapshot._dominatorsTree[this.nodeIndex / this._snapshot._nodeFieldCount] * nodeFieldCount;
        }

        /**
         * @return {!HeapSnapshotWorker.HeapSnapshotEdgeIterator}
         */
        edges() {
            return new HeapSnapshotWorker.HeapSnapshotEdgeIterator(this);
        }

        /**
         * @return {number}
         */
        edgesCount() {
            return (this.edgeIndexesEnd() - this.edgeIndexesStart()) / this._snapshot._edgeFieldsCount;
        }

        /**
         * @return {number}
         */
        id() {
            throw new Error('Not implemented');
        }

        /**
         * @return {boolean}
         */
        isRoot() {
            return this.nodeIndex === this._snapshot._rootNodeIndex;
        }

        /**
         * @return {string}
         */
        name() {
            return this._snapshot.strings[this._name()];
        }

        /**
         * @return {number}
         */
        retainedSize() {
            return this._snapshot._retainedSizes[this.ordinal()];
        }

        /**
         * @return {!HeapSnapshotWorker.HeapSnapshotRetainerEdgeIterator}
         */
        retainers() {
            return new HeapSnapshotWorker.HeapSnapshotRetainerEdgeIterator(this);
        }

        /**
         * @return {number}
         */
        retainersCount() {
            let snapshot = this._snapshot;
            let ordinal = this.ordinal();
            return snapshot._firstRetainerIndex[ordinal + 1] - snapshot._firstRetainerIndex[ordinal];
        }

        /**
         * @return {number}
         */
        selfSize() {
            let snapshot = this._snapshot;
            return snapshot.nodes[this.nodeIndex + snapshot._nodeSelfSizeOffset];
        }

        /**
         * @return {string}
         */
        type() {
            return this._snapshot._nodeTypes[this.rawType()];
        }

        /**
         * @return {number}
         */
        traceNodeId() {
            let snapshot = this._snapshot;
            return snapshot.nodes[this.nodeIndex + snapshot._nodeTraceNodeIdOffset];
        }

        /**
         * @override
         * @return {number}
         */
        itemIndex() {
            return this.nodeIndex;
        }

        /**
         * @override
         * @return {!common.model.Node}
         */
        serialize() {
            return new common.model.Node(
                this.id(), this.name(), this.distance(), this.nodeIndex, this.retainedSize(), this.selfSize(), this.type());
        }

        /**
         * @return {number}
         */
        _name() {
            let snapshot = this._snapshot;
            return snapshot.nodes[this.nodeIndex + snapshot._nodeNameOffset];
        }

        /**
         * @return {number}
         */
        edgeIndexesStart() {
            return this._snapshot._firstEdgeIndexes[this.ordinal()];
        }

        /**
         * @return {number}
         */
        edgeIndexesEnd() {
            return this._snapshot._firstEdgeIndexes[this.ordinal() + 1];
        }

        /**
         * @return {number}
         */
        ordinal() {
            return this.nodeIndex / this._snapshot._nodeFieldCount;
        }

        /**
         * @return {number}
         */
        _nextNodeIndex() {
            return this.nodeIndex + this._snapshot._nodeFieldCount;
        }

        /**
         * @protected
         * @return {number}
         */
        rawType() {
            let snapshot = this._snapshot;
            return snapshot.nodes[this.nodeIndex + snapshot._nodeTypeOffset];
        }
    };

    /**
     * @implements {HeapSnapshotWorker.HeapSnapshotItemIterator}
     * @unrestricted
     */
    HeapSnapshotWorker.HeapSnapshotNodeIterator = class {
        /**
         * @param {!HeapSnapshotWorker.HeapSnapshotNode} node
         */
        constructor(node) {
            this.node = node;
            this._nodesLength = node._snapshot.nodes.length;
        }

        /**
         * @override
         * @return {boolean}
         */
        hasNext() {
            return this.node.nodeIndex < this._nodesLength;
        }

        /**
         * @override
         * @return {!HeapSnapshotWorker.HeapSnapshotNode}
         */
        item() {
            return this.node;
        }

        /**
         * @override
         */
        next() {
            this.node.nodeIndex = this.node._nextNodeIndex();
        }
    };

    /**
     * @implements {HeapSnapshotWorker.HeapSnapshotItemIterator}
     * @unrestricted
     */
    HeapSnapshotWorker.HeapSnapshotIndexRangeIterator = class {
        /**
         * @param {!HeapSnapshotWorker.HeapSnapshotItemIndexProvider} itemProvider
         * @param {!Array.<number>|!Uint32Array} indexes
         */
        constructor(itemProvider, indexes) {
            this._itemProvider = itemProvider;
            this._indexes = indexes;
            this._position = 0;
        }

        /**
         * @override
         * @return {boolean}
         */
        hasNext() {
            return this._position < this._indexes.length;
        }

        /**
         * @override
         * @return {!HeapSnapshotWorker.HeapSnapshotItem}
         */
        item() {
            let index = this._indexes[this._position];
            return this._itemProvider.itemForIndex(index);
        }

        /**
         * @override
         */
        next() {
            ++this._position;
        }
    };

    /**
     * @implements {HeapSnapshotWorker.HeapSnapshotItemIterator}
     * @unrestricted
     */
    HeapSnapshotWorker.HeapSnapshotFilteredIterator = class {
        /**
         * @param {!HeapSnapshotWorker.HeapSnapshotItemIterator} iterator
         * @param {function(!HeapSnapshotWorker.HeapSnapshotItem):boolean=} filter
         */
        constructor(iterator, filter) {
            this._iterator = iterator;
            this._filter = filter;
            this._skipFilteredItems();
        }

        /**
         * @override
         * @return {boolean}
         */
        hasNext() {
            return this._iterator.hasNext();
        }

        /**
         * @override
         * @return {!HeapSnapshotWorker.HeapSnapshotItem}
         */
        item() {
            return this._iterator.item();
        }

        /**
         * @override
         */
        next() {
            this._iterator.next();
            this._skipFilteredItems();
        }

        _skipFilteredItems() {
            while (this._iterator.hasNext() && !this._filter(this._iterator.item()))
                this._iterator.next();
        }
    };

    /**
     * @unrestricted
     */
    HeapSnapshotWorker.HeapSnapshotProgress = class {
        /**
         * @param {!HeapSnapshotWorker.HeapSnapshotWorkerDispatcher=} dispatcher
         */
        constructor(dispatcher) {
            this._dispatcher = dispatcher;
        }

        /**
         * @param {string} status
         */
        updateStatus(status) {
            this._sendUpdateEvent(Common.UIString(status));
        }

        /**
         * @param {string} title
         * @param {number} value
         * @param {number} total
         */
        updateProgress(title, value, total) {
            let percentValue = ((total ? (value / total) : 0) * 100).toFixed(0);
            this._sendUpdateEvent(Common.UIString(title, percentValue));
        }

        /**
         * @param {string} error
         */
        reportProblem(error) {
            // May be undefined in tests.
            if (this._dispatcher)
                this._dispatcher.sendEvent(common.model.HeapSnapshotProgressEvent.BrokenSnapshot, error);
        }

        /**
         * @param {string} text
         */
        _sendUpdateEvent(text) {
            // May be undefined in tests.
            if (this._dispatcher)
                this._dispatcher.sendEvent(common.model.HeapSnapshotProgressEvent.Update, text);
        }
    };

    /**
     * @unrestricted
     */
    HeapSnapshotWorker.HeapSnapshotProblemReport = class {
        /**
         * @param {string} title
         */
        constructor(title) {
            this._errors = [title];
        }

        /**
         * @param {string} error
         */
        addError(error) {
            if (this._errors.length > 100)
                return;
            this._errors.push(error);
        }

        /**
         * @override
         * @return {string}
         */
        toString() {
            return this._errors.join('\n  ');
        }
    };

    /**
     * @unrestricted
     */
    HeapSnapshotWorker.HeapSnapshot = class {
        /**
         * @param {!Object} profile
         * @param {!HeapSnapshotWorker.HeapSnapshotProgress} progress
         */
        constructor(profile, progress) {
            /** @type {!Uint32Array} */
            this.nodes = profile.nodes;
            /** @type {!Uint32Array} */
            this.containmentEdges = profile.edges;
            /** @type {!HeapSnapshotMetainfo} */
            this._metaNode = profile.snapshot.meta;
            /** @type {!Array.<number>} */
            this._rawSamples = profile.samples;
            /** @type {?common.model.Samples} */
            this._samples = null;
            /** @type {!Array.<string>} */
            this.strings = profile.strings;
            this._progress = progress;

            this._noDistance = -5;
            this._rootNodeIndex = 0;
            if (profile.snapshot.root_index)
                this._rootNodeIndex = profile.snapshot.root_index;

            this._snapshotDiffs = {};
            this._aggregatesForDiff = null;
            this._aggregates = {};
            this._aggregatesSortedFlags = {};
            this._profile = profile;
        }

        /**
         * @protected
         */
        initializeP() {
            return co.call(this, _initialize);

            /**
             * @inner
             */
            function* _initialize() {
                let meta = this._metaNode;

                this._nodeTypeOffset = meta.node_fields.indexOf('type');
                this._nodeNameOffset = meta.node_fields.indexOf('name');
                this._nodeIdOffset = meta.node_fields.indexOf('id');
                this._nodeSelfSizeOffset = meta.node_fields.indexOf('self_size');
                this._nodeEdgeCountOffset = meta.node_fields.indexOf('edge_count');
                this._nodeTraceNodeIdOffset = meta.node_fields.indexOf('trace_node_id');
                this._nodeFieldCount = meta.node_fields.length;

                this._nodeTypes = meta.node_types[this._nodeTypeOffset];
                this._nodeArrayType = this._nodeTypes.indexOf('array');
                this._nodeHiddenType = this._nodeTypes.indexOf('hidden');
                this._nodeObjectType = this._nodeTypes.indexOf('object');
                this._nodeNativeType = this._nodeTypes.indexOf('native');
                this._nodeConsStringType = this._nodeTypes.indexOf('concatenated string');
                this._nodeSlicedStringType = this._nodeTypes.indexOf('sliced string');
                this._nodeCodeType = this._nodeTypes.indexOf('code');
                this._nodeSyntheticType = this._nodeTypes.indexOf('synthetic');

                this._edgeFieldsCount = meta.edge_fields.length;
                this._edgeTypeOffset = meta.edge_fields.indexOf('type');
                this._edgeNameOffset = meta.edge_fields.indexOf('name_or_index');
                this._edgeToNodeOffset = meta.edge_fields.indexOf('to_node');

                this._edgeTypes = meta.edge_types[this._edgeTypeOffset];
                this._edgeTypes.push('invisible');
                this._edgeElementType = this._edgeTypes.indexOf('element');
                this._edgeHiddenType = this._edgeTypes.indexOf('hidden');
                this._edgeInternalType = this._edgeTypes.indexOf('internal');
                this._edgeShortcutType = this._edgeTypes.indexOf('shortcut');
                this._edgeWeakType = this._edgeTypes.indexOf('weak');
                this._edgeInvisibleType = this._edgeTypes.indexOf('invisible');

                this.nodeCount = this.nodes.length / this._nodeFieldCount;
                this._edgeCount = this.containmentEdges.length / this._edgeFieldsCount;

                this._retainedSizes = new Float64Array(this.nodeCount);
                this._firstEdgeIndexes = new Uint32Array(this.nodeCount + 1);
                this._retainingNodes = new Uint32Array(this._edgeCount);
                this._retainingEdges = new Uint32Array(this._edgeCount);
                this._firstRetainerIndex = new Uint32Array(this.nodeCount + 1);
                this._nodeDistances = new Int32Array(this.nodeCount);
                this._firstDominatedNodeIndex = new Uint32Array(this.nodeCount + 1);
                this._dominatedNodes = new Uint32Array(this.nodeCount - 1);

                this._buildEdgeIndexes();
                yield this._progress.updateStatusP({ prefix: `构建 Edge Indexs 完毕`, suffix: `准备开始构建 Retainers` });
                this._buildRetainers();
                yield this._progress.updateStatusP({ prefix: `构建 Retainers 完毕`, suffix: `准备开始计算 Node Flags` });
                this.calculateFlags();
                yield this._progress.updateStatusP({ prefix: `计算 Node Flags 完毕`, suffix: `准备开始计算 Distances` });
                this.calculateDistances();
                yield this._progress.updateStatusP({ prefix: `计算 Distances 完毕`, suffix: `准备开始构建 Postorder Index` });
                let result = this._buildPostOrderIndex();
                yield this._progress.updateStatusP({ prefix: `构建 Postorder Index 完毕`, suffix: `准备开始构建 Dominator Tree` });
                // Actually it is array that maps node ordinal number to dominator node ordinal number.
                this._dominatorsTree = this._buildDominatorTree(result.postOrderIndex2NodeOrdinal, result.nodeOrdinal2PostOrderIndex);
                yield this._progress.updateStatusP({ prefix: `构建 Dominator Tree 完毕`, suffix: `准备开始计算 Retained Sizes` });
                this._calculateRetainedSizes(result.postOrderIndex2NodeOrdinal);
                yield this._progress.updateStatusP({ prefix: `计算 Retained Sizes 完毕`, suffix: `准备开始构建 Dominated Nodes` });
                this._buildDominatedNodes();
                this._progress.updateStatusP({ prefix: `构建 Dominated Nodes 完毕`, suffix: `准备开始计算 Statistics` });
                this.calculateStatistics();
                yield this._progress.updateStatusP({ prefix: `计算 Statistics 完毕`, suffix: `准备开始计算 Aggregates` });
                this.aggregatesWithFilter(new common.model.NodeFilter());
                yield this._progress.updateStatusP({ prefix: `计算 Aggregates 完毕` });
                // this._progress.updateStatus('Calculating samples\u2026');
                // this._buildSamples();
                yield this._progress.updateStatusP({ prefix: `HeapSnapshot 所有分析完成` }, true);

                if (this._profile.snapshot.trace_function_count) {
                    this._progress.updateStatus('Building allocation statistics\u2026');
                    let nodes = this.nodes;
                    let nodesLength = nodes.length;
                    let nodeFieldCount = this._nodeFieldCount;
                    let node = this.rootNode();
                    let liveObjects = {};
                    for (let nodeIndex = 0; nodeIndex < nodesLength; nodeIndex += nodeFieldCount) {
                        node.nodeIndex = nodeIndex;
                        let traceNodeId = node.traceNodeId();
                        let stats = liveObjects[traceNodeId];
                        if (!stats)
                            liveObjects[traceNodeId] = stats = { count: 0, size: 0, ids: [] };
                        stats.count++;
                        stats.size += node.selfSize();
                        stats.ids.push(node.id());
                    }
                    this._allocationProfile = new HeapSnapshotWorker.AllocationProfile(this._profile, liveObjects);
                    this._progress.updateStatus('Done');
                }
            }
        }

        /**
         * @protected
         */
        initialize() {
            let meta = this._metaNode;

            this._nodeTypeOffset = meta.node_fields.indexOf('type');
            this._nodeNameOffset = meta.node_fields.indexOf('name');
            this._nodeIdOffset = meta.node_fields.indexOf('id');
            this._nodeSelfSizeOffset = meta.node_fields.indexOf('self_size');
            this._nodeEdgeCountOffset = meta.node_fields.indexOf('edge_count');
            this._nodeTraceNodeIdOffset = meta.node_fields.indexOf('trace_node_id');
            this._nodeFieldCount = meta.node_fields.length;

            this._nodeTypes = meta.node_types[this._nodeTypeOffset];
            this._nodeArrayType = this._nodeTypes.indexOf('array');
            this._nodeHiddenType = this._nodeTypes.indexOf('hidden');
            this._nodeObjectType = this._nodeTypes.indexOf('object');
            this._nodeNativeType = this._nodeTypes.indexOf('native');
            this._nodeConsStringType = this._nodeTypes.indexOf('concatenated string');
            this._nodeSlicedStringType = this._nodeTypes.indexOf('sliced string');
            this._nodeCodeType = this._nodeTypes.indexOf('code');
            this._nodeSyntheticType = this._nodeTypes.indexOf('synthetic');

            this._edgeFieldsCount = meta.edge_fields.length;
            this._edgeTypeOffset = meta.edge_fields.indexOf('type');
            this._edgeNameOffset = meta.edge_fields.indexOf('name_or_index');
            this._edgeToNodeOffset = meta.edge_fields.indexOf('to_node');

            this._edgeTypes = meta.edge_types[this._edgeTypeOffset];
            this._edgeTypes.push('invisible');
            this._edgeElementType = this._edgeTypes.indexOf('element');
            this._edgeHiddenType = this._edgeTypes.indexOf('hidden');
            this._edgeInternalType = this._edgeTypes.indexOf('internal');
            this._edgeShortcutType = this._edgeTypes.indexOf('shortcut');
            this._edgeWeakType = this._edgeTypes.indexOf('weak');
            this._edgeInvisibleType = this._edgeTypes.indexOf('invisible');

            this.nodeCount = this.nodes.length / this._nodeFieldCount;
            this._edgeCount = this.containmentEdges.length / this._edgeFieldsCount;

            this._retainedSizes = new Float64Array(this.nodeCount);
            this._firstEdgeIndexes = new Uint32Array(this.nodeCount + 1);
            this._retainingNodes = new Uint32Array(this._edgeCount);
            this._retainingEdges = new Uint32Array(this._edgeCount);
            this._firstRetainerIndex = new Uint32Array(this.nodeCount + 1);
            this._nodeDistances = new Int32Array(this.nodeCount);
            this._firstDominatedNodeIndex = new Uint32Array(this.nodeCount + 1);
            this._dominatedNodes = new Uint32Array(this.nodeCount - 1);

            this._progress.updateStatus('Building edge indexes\u2026');
            this._buildEdgeIndexes();
            this._progress.updateStatus('Building retainers\u2026');
            this._buildRetainers();
            this._progress.updateStatus('Calculating node flags\u2026');
            this.calculateFlags();
            this._progress.updateStatus('Calculating distances\u2026');
            this.calculateDistances();
            this._progress.updateStatus('Building postorder index\u2026');
            let result = this._buildPostOrderIndex();
            // Actually it is array that maps node ordinal number to dominator node ordinal number.
            this._progress.updateStatus('Building dominator tree\u2026');
            this._dominatorsTree =
                this._buildDominatorTree(result.postOrderIndex2NodeOrdinal, result.nodeOrdinal2PostOrderIndex);
            this._progress.updateStatus('Calculating retained sizes\u2026');
            this._calculateRetainedSizes(result.postOrderIndex2NodeOrdinal);
            this._progress.updateStatus('Building dominated nodes\u2026');
            this._buildDominatedNodes();
            this._progress.updateStatus('Calculating statistics\u2026');
            this.calculateStatistics();
            this._progress.updateStatus('Calculating aggregates\u2026');
            this.aggregatesWithFilter(new common.model.NodeFilter());
            this._progress.updateStatus('Calculating samples\u2026');
            this._buildSamples();
            this._progress.updateStatus('Finished processing.');

            if (this._profile.snapshot.trace_function_count) {
                this._progress.updateStatus('Building allocation statistics\u2026');
                let nodes = this.nodes;
                let nodesLength = nodes.length;
                let nodeFieldCount = this._nodeFieldCount;
                let node = this.rootNode();
                let liveObjects = {};
                for (let nodeIndex = 0; nodeIndex < nodesLength; nodeIndex += nodeFieldCount) {
                    node.nodeIndex = nodeIndex;
                    let traceNodeId = node.traceNodeId();
                    let stats = liveObjects[traceNodeId];
                    if (!stats)
                        liveObjects[traceNodeId] = stats = { count: 0, size: 0, ids: [] };
                    stats.count++;
                    stats.size += node.selfSize();
                    stats.ids.push(node.id());
                }
            }
        }

        _buildEdgeIndexes() {
            let nodes = this.nodes;
            let nodeCount = this.nodeCount;
            let firstEdgeIndexes = this._firstEdgeIndexes;
            let nodeFieldCount = this._nodeFieldCount;
            let edgeFieldsCount = this._edgeFieldsCount;
            let nodeEdgeCountOffset = this._nodeEdgeCountOffset;
            firstEdgeIndexes[nodeCount] = this.containmentEdges.length;
            for (let nodeOrdinal = 0, edgeIndex = 0; nodeOrdinal < nodeCount; ++nodeOrdinal) {
                firstEdgeIndexes[nodeOrdinal] = edgeIndex;
                edgeIndex += nodes[nodeOrdinal * nodeFieldCount + nodeEdgeCountOffset] * edgeFieldsCount;
            }
        }

        _buildRetainers() {
            let retainingNodes = this._retainingNodes;
            let retainingEdges = this._retainingEdges;
            // Index of the first retainer in the _retainingNodes and _retainingEdges
            // arrays. Addressed by retained node index.
            let firstRetainerIndex = this._firstRetainerIndex;

            let containmentEdges = this.containmentEdges;
            let edgeFieldsCount = this._edgeFieldsCount;
            let nodeFieldCount = this._nodeFieldCount;
            let edgeToNodeOffset = this._edgeToNodeOffset;
            let firstEdgeIndexes = this._firstEdgeIndexes;
            let nodeCount = this.nodeCount;

            for (let toNodeFieldIndex = edgeToNodeOffset, l = containmentEdges.length; toNodeFieldIndex < l;
                toNodeFieldIndex += edgeFieldsCount) {
                let toNodeIndex = containmentEdges[toNodeFieldIndex];
                if (toNodeIndex % nodeFieldCount)
                    throw new Error('Invalid toNodeIndex ' + toNodeIndex);
                ++firstRetainerIndex[toNodeIndex / nodeFieldCount];
            }
            for (let i = 0, firstUnusedRetainerSlot = 0; i < nodeCount; i++) {
                let retainersCount = firstRetainerIndex[i];
                firstRetainerIndex[i] = firstUnusedRetainerSlot;
                retainingNodes[firstUnusedRetainerSlot] = retainersCount;
                firstUnusedRetainerSlot += retainersCount;
            }
            firstRetainerIndex[nodeCount] = retainingNodes.length;

            let nextNodeFirstEdgeIndex = firstEdgeIndexes[0];
            for (let srcNodeOrdinal = 0; srcNodeOrdinal < nodeCount; ++srcNodeOrdinal) {
                let firstEdgeIndex = nextNodeFirstEdgeIndex;
                nextNodeFirstEdgeIndex = firstEdgeIndexes[srcNodeOrdinal + 1];
                let srcNodeIndex = srcNodeOrdinal * nodeFieldCount;
                for (let edgeIndex = firstEdgeIndex; edgeIndex < nextNodeFirstEdgeIndex; edgeIndex += edgeFieldsCount) {
                    let toNodeIndex = containmentEdges[edgeIndex + edgeToNodeOffset];
                    if (toNodeIndex % nodeFieldCount)
                        throw new Error('Invalid toNodeIndex ' + toNodeIndex);
                    let firstRetainerSlotIndex = firstRetainerIndex[toNodeIndex / nodeFieldCount];
                    let nextUnusedRetainerSlotIndex = firstRetainerSlotIndex + (--retainingNodes[firstRetainerSlotIndex]);
                    retainingNodes[nextUnusedRetainerSlotIndex] = srcNodeIndex;
                    retainingEdges[nextUnusedRetainerSlotIndex] = edgeIndex;
                }
            }
        }

        /**
         * @param {number=} nodeIndex
         */
        createNode(nodeIndex) {
            throw new Error('Not implemented');
        }

        /**
         * @param {number} edgeIndex
         * @return {!HeapSnapshotWorker.JSHeapSnapshotEdge}
         */
        createEdge(edgeIndex) {
            throw new Error('Not implemented');
        }

        /**
         * @param {number} retainerIndex
         * @return {!HeapSnapshotWorker.JSHeapSnapshotRetainerEdge}
         */
        createRetainingEdge(retainerIndex) {
            throw new Error('Not implemented');
        }

        _allNodes() {
            return new HeapSnapshotWorker.HeapSnapshotNodeIterator(this.rootNode());
        }

        /**
         * @return {!HeapSnapshotWorker.HeapSnapshotNode}
         */
        rootNode() {
            return this.createNode(this._rootNodeIndex);
        }

        get rootNodeIndex() {
            return this._rootNodeIndex;
        }

        get totalSize() {
            return this.rootNode().retainedSize();
        }

        _getDominatedIndex(nodeIndex) {
            if (nodeIndex % this._nodeFieldCount)
                throw new Error('Invalid nodeIndex: ' + nodeIndex);
            return this._firstDominatedNodeIndex[nodeIndex / this._nodeFieldCount];
        }

        /**
         * @param {!common.model.NodeFilter} nodeFilter
         * @return {undefined|function(!HeapSnapshotWorker.HeapSnapshotNode):boolean}
         */
        _createFilter(nodeFilter) {
            let minNodeId = nodeFilter.minNodeId;
            let maxNodeId = nodeFilter.maxNodeId;
            let allocationNodeId = nodeFilter.allocationNodeId;
            let filter;
            if (typeof allocationNodeId === 'number') {
                filter = this._createAllocationStackFilter(allocationNodeId);
                filter.key = 'AllocationNodeId: ' + allocationNodeId;
            } else if (typeof minNodeId === 'number' && typeof maxNodeId === 'number') {
                filter = this._createNodeIdFilter(minNodeId, maxNodeId);
                filter.key = 'NodeIdRange: ' + minNodeId + '..' + maxNodeId;
            }
            return filter;
        }

        /**
         * @param {!common.model.SearchConfig} searchConfig
         * @param {!common.model.NodeFilter} nodeFilter
         * @return {!Array.<number>}
         */
        search(searchConfig, nodeFilter) {
            let query = searchConfig.query;

            function filterString(matchedStringIndexes, string, index) {
                if (string.indexOf(query) !== -1)
                    matchedStringIndexes.add(index);
                return matchedStringIndexes;
            }

            let regexp = searchConfig.isRegex ? new RegExp(query) : createPlainTextSearchRegex(query, 'i');

            function filterRegexp(matchedStringIndexes, string, index) {
                if (regexp.test(string))
                    matchedStringIndexes.add(index);
                return matchedStringIndexes;
            }

            let stringFilter = (searchConfig.isRegex || !searchConfig.caseSensitive) ? filterRegexp : filterString;
            let stringIndexes = this.strings.reduce(stringFilter, new Set());

            if (!stringIndexes.size)
                return [];

            let filter = this._createFilter(nodeFilter);
            let nodeIds = [];
            let nodesLength = this.nodes.length;
            let nodes = this.nodes;
            let nodeNameOffset = this._nodeNameOffset;
            let nodeIdOffset = this._nodeIdOffset;
            let nodeFieldCount = this._nodeFieldCount;
            let node = this.rootNode();

            for (let nodeIndex = 0; nodeIndex < nodesLength; nodeIndex += nodeFieldCount) {
                node.nodeIndex = nodeIndex;
                if (filter && !filter(node))
                    continue;
                if (stringIndexes.has(nodes[nodeIndex + nodeNameOffset]))
                    nodeIds.push(nodes[nodeIndex + nodeIdOffset]);
            }
            return nodeIds;
        }

        /**
         * @param {!common.model.NodeFilter} nodeFilter
         * @return {!Object.<string, !common.model.Aggregate>}
         */
        aggregatesWithFilter(nodeFilter) {
            let filter = this._createFilter(nodeFilter);
            let key = filter ? filter.key : 'allObjects';
            return this.aggregates(false, key, filter);
        }

        /**
         * @param {number} minNodeId
         * @param {number} maxNodeId
         * @return {function(!HeapSnapshotWorker.HeapSnapshotNode):boolean}
         */
        _createNodeIdFilter(minNodeId, maxNodeId) {
            /**
             * @param {!HeapSnapshotWorker.HeapSnapshotNode} node
             * @return {boolean}
             */
            function nodeIdFilter(node) {
                let id = node.id();
                return id > minNodeId && id <= maxNodeId;
            }

            return nodeIdFilter;
        }

        /**
         * @param {number} bottomUpAllocationNodeId
         * @return {function(!HeapSnapshotWorker.HeapSnapshotNode):boolean|undefined}
         */
        _createAllocationStackFilter(bottomUpAllocationNodeId) {
            let traceIds = this._allocationProfile.traceIds(bottomUpAllocationNodeId);
            if (!traceIds.length)
                return undefined;
            let set = {};
            for (let i = 0; i < traceIds.length; i++)
                set[traceIds[i]] = true;
            /**
             * @param {!HeapSnapshotWorker.HeapSnapshotNode} node
             * @return {boolean}
             */
            function traceIdFilter(node) {
                return !!set[node.traceNodeId()];
            }

            return traceIdFilter;
        }

        /**
         * @param {boolean} sortedIndexes
         * @param {string=} key
         * @param {function(!HeapSnapshotWorker.HeapSnapshotNode):boolean=} filter
         * @return {!Object.<string, !common.model.Aggregate>}
         */
        aggregates(sortedIndexes, key, filter) {
            let aggregatesByClassName = key && this._aggregates[key];
            if (!aggregatesByClassName) {
                let aggregates = this._buildAggregates(filter);
                this._calculateClassesRetainedSize(aggregates.aggregatesByClassIndex, filter);
                aggregatesByClassName = aggregates.aggregatesByClassName;
                if (key)
                    this._aggregates[key] = aggregatesByClassName;
            }

            if (sortedIndexes && (!key || !this._aggregatesSortedFlags[key])) {
                this._sortAggregateIndexes(aggregatesByClassName);
                if (key)
                    this._aggregatesSortedFlags[key] = sortedIndexes;
            }
            return aggregatesByClassName;
        }

        /**
         * @return {!Array.<!common.model.SerializedAllocationNode>}
         */
        allocationTracesTops() {
            return this._allocationProfile.serializeTraceTops();
        }

        /**
         * @param {number} nodeId
         * @return {!common.model.AllocationNodeCallers}
         */
        allocationNodeCallers(nodeId) {
            return this._allocationProfile.serializeCallers(nodeId);
        }

        /**
         * @param {number} nodeIndex
         * @return {?Array.<!common.model.AllocationStackFrame>}
         */
        allocationStack(nodeIndex) {
            let node = this.createNode(nodeIndex);
            let allocationNodeId = node.traceNodeId();
            if (!allocationNodeId)
                return null;
            return this._allocationProfile.serializeAllocationStack(allocationNodeId);
        }

        /**
         * @return {!Object.<string, !common.model.AggregateForDiff>}
         */
        aggregatesForDiff() {
            if (this._aggregatesForDiff)
                return this._aggregatesForDiff;

            let aggregatesByClassName = this.aggregates(true, 'allObjects');
            this._aggregatesForDiff = {};

            let node = this.createNode();
            for (let className in aggregatesByClassName) {
                let aggregate = aggregatesByClassName[className];
                let indexes = aggregate.idxs;
                let ids = new Array(indexes.length);
                let selfSizes = new Array(indexes.length);
                for (let i = 0; i < indexes.length; i++) {
                    node.nodeIndex = indexes[i];
                    ids[i] = node.id();
                    selfSizes[i] = node.selfSize();
                }

                this._aggregatesForDiff[className] = { indexes: indexes, ids: ids, selfSizes: selfSizes };
            }
            return this._aggregatesForDiff;
        }

        /**
         * @protected
         * @param {!HeapSnapshotWorker.HeapSnapshotNode} node
         * @return {boolean}
         */
        isUserRoot(node) {
            return true;
        }

        /**
         * @param {function(!HeapSnapshotWorker.HeapSnapshotNode)} action
         * @param {boolean=} userRootsOnly
         */
        forEachRoot(action, userRootsOnly) {
            for (let iter = this.rootNode().edges(); iter.hasNext(); iter.next()) {
                let node = iter.edge.node();
                if (!userRootsOnly || this.isUserRoot(node))
                    action(node);
            }
        }

        /**
         * @param {function(!HeapSnapshotWorker.HeapSnapshotNode,!HeapSnapshotWorker.HeapSnapshotEdge):boolean=} filter
         */
        calculateDistances(filter) {
            let nodeCount = this.nodeCount;
            let distances = this._nodeDistances;
            let noDistance = this._noDistance;
            for (let i = 0; i < nodeCount; ++i)
                distances[i] = noDistance;

            let nodesToVisit = new Uint32Array(this.nodeCount);
            let nodesToVisitLength = 0;

            /**
             * @param {number} distance
             * @param {!HeapSnapshotWorker.HeapSnapshotNode} node
             */
            function enqueueNode(distance, node) {
                let ordinal = node.ordinal();
                if (distances[ordinal] !== noDistance)
                    return;
                distances[ordinal] = distance;
                nodesToVisit[nodesToVisitLength++] = node.nodeIndex;
            }

            this.forEachRoot(enqueueNode.bind(null, 1), true);
            this._bfs(nodesToVisit, nodesToVisitLength, distances, filter);

            // bfs for the rest of objects
            nodesToVisitLength = 0;
            this.forEachRoot(enqueueNode.bind(null, common.model.baseSystemDistance), false);
            this._bfs(nodesToVisit, nodesToVisitLength, distances, filter);
        }

        /**
         * @param {!Uint32Array} nodesToVisit
         * @param {number} nodesToVisitLength
         * @param {!Int32Array} distances
         * @param {function(!HeapSnapshotWorker.HeapSnapshotNode,!HeapSnapshotWorker.HeapSnapshotEdge):boolean=} filter
         */
        _bfs(nodesToVisit, nodesToVisitLength, distances, filter) {
            // Preload fields into local letiables for better performance.
            let edgeFieldsCount = this._edgeFieldsCount;
            let nodeFieldCount = this._nodeFieldCount;
            let containmentEdges = this.containmentEdges;
            let firstEdgeIndexes = this._firstEdgeIndexes;
            let edgeToNodeOffset = this._edgeToNodeOffset;
            let edgeTypeOffset = this._edgeTypeOffset;
            let nodeCount = this.nodeCount;
            let edgeWeakType = this._edgeWeakType;
            let noDistance = this._noDistance;

            let index = 0;
            let edge = this.createEdge(0);
            let node = this.createNode(0);
            while (index < nodesToVisitLength) {
                let nodeIndex = nodesToVisit[index++];  // shift generates too much garbage.
                let nodeOrdinal = nodeIndex / nodeFieldCount;
                let distance = distances[nodeOrdinal] + 1;
                let firstEdgeIndex = firstEdgeIndexes[nodeOrdinal];
                let edgesEnd = firstEdgeIndexes[nodeOrdinal + 1];
                node.nodeIndex = nodeIndex;
                for (let edgeIndex = firstEdgeIndex; edgeIndex < edgesEnd; edgeIndex += edgeFieldsCount) {
                    let edgeType = containmentEdges[edgeIndex + edgeTypeOffset];
                    if (edgeType === edgeWeakType)
                        continue;
                    let childNodeIndex = containmentEdges[edgeIndex + edgeToNodeOffset];
                    let childNodeOrdinal = childNodeIndex / nodeFieldCount;
                    if (distances[childNodeOrdinal] !== noDistance)
                        continue;
                    edge.edgeIndex = edgeIndex;
                    if (filter && !filter(node, edge))
                        continue;
                    distances[childNodeOrdinal] = distance;
                    nodesToVisit[nodesToVisitLength++] = childNodeIndex;
                }
            }
            if (nodesToVisitLength > nodeCount) {
                throw new Error(
                    'BFS failed. Nodes to visit (' + nodesToVisitLength + ') is more than nodes count (' + nodeCount + ')');
            }
        }

        _buildAggregates(filter) {
            let aggregates = {};
            let aggregatesByClassName = {};
            let classIndexes = [];
            let nodes = this.nodes;
            let mapAndFlag = this.userObjectsMapAndFlag();
            let flags = mapAndFlag ? mapAndFlag.map : null;
            let flag = mapAndFlag ? mapAndFlag.flag : 0;
            let nodesLength = nodes.length;
            let nodeNativeType = this._nodeNativeType;
            let nodeFieldCount = this._nodeFieldCount;
            let selfSizeOffset = this._nodeSelfSizeOffset;
            let nodeTypeOffset = this._nodeTypeOffset;
            let node = this.rootNode();
            let nodeDistances = this._nodeDistances;

            for (let nodeIndex = 0; nodeIndex < nodesLength; nodeIndex += nodeFieldCount) {
                let nodeOrdinal = nodeIndex / nodeFieldCount;
                if (flags && !(flags[nodeOrdinal] & flag))
                    continue;
                node.nodeIndex = nodeIndex;
                if (filter && !filter(node))
                    continue;
                let selfSize = nodes[nodeIndex + selfSizeOffset];
                if (!selfSize && nodes[nodeIndex + nodeTypeOffset] !== nodeNativeType)
                    continue;
                let classIndex = node.classIndex();
                if (!(classIndex in aggregates)) {
                    let nodeType = node.type();
                    let nameMatters = nodeType === 'object' || nodeType === 'native';
                    let value = {
                        count: 1,
                        distance: nodeDistances[nodeOrdinal],
                        self: selfSize,
                        maxRet: 0,
                        type: nodeType,
                        name: nameMatters ? node.name() : null,
                        // idxs: [nodeIndex],
                        idxs: []
                    };
                    aggregates[classIndex] = value;
                    classIndexes.push(classIndex);
                    aggregatesByClassName[node.className()] = value;
                } else {
                    let clss = aggregates[classIndex];
                    clss.distance = Math.min(clss.distance, nodeDistances[nodeOrdinal]);
                    ++clss.count;
                    clss.self += selfSize;
                    // clss.idxs.push(nodeIndex);
                }
            }

            // Shave off provisionally allocated space.
            for (let i = 0, l = classIndexes.length; i < l; ++i) {
                let classIndex = classIndexes[i];
                aggregates[classIndex].idxs = aggregates[classIndex].idxs.slice();
            }
            return { aggregatesByClassName: aggregatesByClassName, aggregatesByClassIndex: aggregates };
        }

        _calculateClassesRetainedSize(aggregates, filter) {
            let rootNodeIndex = this._rootNodeIndex;
            let node = this.createNode(rootNodeIndex);
            let list = [rootNodeIndex];
            let sizes = [-1];
            let classes = [];
            let seenClassNameIndexes = {};
            let nodeFieldCount = this._nodeFieldCount;
            let nodeTypeOffset = this._nodeTypeOffset;
            let nodeNativeType = this._nodeNativeType;
            let dominatedNodes = this._dominatedNodes;
            let nodes = this.nodes;
            let mapAndFlag = this.userObjectsMapAndFlag();
            let flags = mapAndFlag ? mapAndFlag.map : null;
            let flag = mapAndFlag ? mapAndFlag.flag : 0;
            let firstDominatedNodeIndex = this._firstDominatedNodeIndex;

            while (list.length) {
                let nodeIndex = list.pop();
                node.nodeIndex = nodeIndex;
                let classIndex = node.classIndex();
                let seen = !!seenClassNameIndexes[classIndex];
                let nodeOrdinal = nodeIndex / nodeFieldCount;
                let dominatedIndexFrom = firstDominatedNodeIndex[nodeOrdinal];
                let dominatedIndexTo = firstDominatedNodeIndex[nodeOrdinal + 1];

                if (!seen && (!flags || (flags[nodeOrdinal] & flag)) && (!filter || filter(node)) &&
                    (node.selfSize() || nodes[nodeIndex + nodeTypeOffset] === nodeNativeType)) {
                    aggregates[classIndex].maxRet += node.retainedSize();
                    if (dominatedIndexFrom !== dominatedIndexTo) {
                        seenClassNameIndexes[classIndex] = true;
                        sizes.push(list.length);
                        classes.push(classIndex);
                    }
                }
                for (let i = dominatedIndexFrom; i < dominatedIndexTo; i++)
                    list.push(dominatedNodes[i]);

                let l = list.length;
                while (sizes[sizes.length - 1] === l) {
                    sizes.pop();
                    classIndex = classes.pop();
                    seenClassNameIndexes[classIndex] = false;
                }
            }
        }

        _sortAggregateIndexes(aggregates) {
            let nodeA = this.createNode();
            let nodeB = this.createNode();
            for (let clss in aggregates) {
                aggregates[clss].idxs.sort(function (idxA, idxB) {
                    nodeA.nodeIndex = idxA;
                    nodeB.nodeIndex = idxB;
                    return nodeA.id() < nodeB.id() ? -1 : 1;
                });
            }
        }

        /**
         * The function checks is the edge should be considered during building
         * postorder iterator and dominator tree.
         *
         * @param {number} nodeIndex
         * @param {number} edgeType
         * @return {boolean}
         */
        _isEssentialEdge(nodeIndex, edgeType) {
            // Shortcuts at the root node have special meaning of marking user global objects.
            return edgeType !== this._edgeWeakType &&
                (edgeType !== this._edgeShortcutType || nodeIndex === this._rootNodeIndex);
        }

        _buildPostOrderIndex() {
            let nodeFieldCount = this._nodeFieldCount;
            let nodeCount = this.nodeCount;
            let rootNodeOrdinal = this._rootNodeIndex / nodeFieldCount;

            let edgeFieldsCount = this._edgeFieldsCount;
            let edgeTypeOffset = this._edgeTypeOffset;
            let edgeToNodeOffset = this._edgeToNodeOffset;
            let firstEdgeIndexes = this._firstEdgeIndexes;
            let containmentEdges = this.containmentEdges;

            let mapAndFlag = this.userObjectsMapAndFlag();
            let flags = mapAndFlag ? mapAndFlag.map : null;
            let flag = mapAndFlag ? mapAndFlag.flag : 0;

            let stackNodes = new Uint32Array(nodeCount);
            let stackCurrentEdge = new Uint32Array(nodeCount);
            let postOrderIndex2NodeOrdinal = new Uint32Array(nodeCount);
            let nodeOrdinal2PostOrderIndex = new Uint32Array(nodeCount);
            let visited = new Uint8Array(nodeCount);
            let postOrderIndex = 0;

            let stackTop = 0;
            stackNodes[0] = rootNodeOrdinal;
            stackCurrentEdge[0] = firstEdgeIndexes[rootNodeOrdinal];
            visited[rootNodeOrdinal] = 1;

            let iteration = 0;
            while (true) {
                ++iteration;
                while (stackTop >= 0) {
                    let nodeOrdinal = stackNodes[stackTop];
                    let edgeIndex = stackCurrentEdge[stackTop];
                    let edgesEnd = firstEdgeIndexes[nodeOrdinal + 1];

                    if (edgeIndex < edgesEnd) {
                        stackCurrentEdge[stackTop] += edgeFieldsCount;
                        let edgeType = containmentEdges[edgeIndex + edgeTypeOffset];
                        if (!this._isEssentialEdge(nodeOrdinal * nodeFieldCount, edgeType))
                            continue;
                        let childNodeIndex = containmentEdges[edgeIndex + edgeToNodeOffset];
                        let childNodeOrdinal = childNodeIndex / nodeFieldCount;
                        if (visited[childNodeOrdinal])
                            continue;
                        let nodeFlag = !flags || (flags[nodeOrdinal] & flag);
                        let childNodeFlag = !flags || (flags[childNodeOrdinal] & flag);
                        // We are skipping the edges from non-page-owned nodes to page-owned nodes.
                        // Otherwise the dominators for the objects that also were retained by debugger would be affected.
                        if (nodeOrdinal !== rootNodeOrdinal && childNodeFlag && !nodeFlag)
                            continue;
                        ++stackTop;
                        stackNodes[stackTop] = childNodeOrdinal;
                        stackCurrentEdge[stackTop] = firstEdgeIndexes[childNodeOrdinal];
                        visited[childNodeOrdinal] = 1;
                    } else {
                        // Done with all the node children
                        nodeOrdinal2PostOrderIndex[nodeOrdinal] = postOrderIndex;
                        postOrderIndex2NodeOrdinal[postOrderIndex++] = nodeOrdinal;
                        --stackTop;
                    }
                }

                if (postOrderIndex === nodeCount || iteration > 1)
                    break;
                let errors = new HeapSnapshotWorker.HeapSnapshotProblemReport(
                    `Heap snapshot: ${nodeCount -
                    postOrderIndex} nodes are unreachable from the root. Following nodes have only weak retainers:`);
                let dumpNode = this.rootNode();
                // Remove root from the result (last node in the array) and put it at the bottom of the stack so that it is
                // visited after all orphan nodes and their subgraphs.
                --postOrderIndex;
                stackTop = 0;
                stackNodes[0] = rootNodeOrdinal;
                stackCurrentEdge[0] = firstEdgeIndexes[rootNodeOrdinal + 1];  // no need to reiterate its edges
                for (let i = 0; i < nodeCount; ++i) {
                    if (visited[i] || !this._hasOnlyWeakRetainers(i))
                        continue;

                    // Add all nodes that have only weak retainers to traverse their subgraphs.
                    stackNodes[++stackTop] = i;
                    stackCurrentEdge[stackTop] = firstEdgeIndexes[i];
                    visited[i] = 1;

                    dumpNode.nodeIndex = i * nodeFieldCount;
                    let retainers = [];
                    for (let it = dumpNode.retainers(); it.hasNext(); it.next())
                        retainers.push(`${it.item().node().name()}@${it.item().node().id()}.${it.item().name()}`);
                    errors.addError(`${dumpNode.name()} @${dumpNode.id()}  weak retainers: ${retainers.join(', ')}`);
                }
                this._progress.consoleWarn(errors.toString());
            }

            // If we already processed all orphan nodes that have only weak retainers and still have some orphans...
            if (postOrderIndex !== nodeCount) {
                let errors = new HeapSnapshotWorker.HeapSnapshotProblemReport(
                    'Still found ' + (nodeCount - postOrderIndex) + ' unreachable nodes in heap snapshot:');
                let dumpNode = this.rootNode();
                // Remove root from the result (last node in the array) and put it at the bottom of the stack so that it is
                // visited after all orphan nodes and their subgraphs.
                --postOrderIndex;
                for (let i = 0; i < nodeCount; ++i) {
                    if (visited[i])
                        continue;
                    dumpNode.nodeIndex = i * nodeFieldCount;
                    errors.addError(dumpNode.name() + ' @' + dumpNode.id());
                    // Fix it by giving the node a postorder index anyway.
                    nodeOrdinal2PostOrderIndex[i] = postOrderIndex;
                    postOrderIndex2NodeOrdinal[postOrderIndex++] = i;
                }
                nodeOrdinal2PostOrderIndex[rootNodeOrdinal] = postOrderIndex;
                postOrderIndex2NodeOrdinal[postOrderIndex++] = rootNodeOrdinal;
                console.warn(errors.toString());
            }

            return {
                postOrderIndex2NodeOrdinal: postOrderIndex2NodeOrdinal,
                nodeOrdinal2PostOrderIndex: nodeOrdinal2PostOrderIndex
            };
        }

        /**
         * @param {number} nodeOrdinal
         * @return {boolean}
         */
        _hasOnlyWeakRetainers(nodeOrdinal) {
            let edgeTypeOffset = this._edgeTypeOffset;
            let edgeWeakType = this._edgeWeakType;
            let edgeShortcutType = this._edgeShortcutType;
            let containmentEdges = this.containmentEdges;
            let retainingEdges = this._retainingEdges;
            let beginRetainerIndex = this._firstRetainerIndex[nodeOrdinal];
            let endRetainerIndex = this._firstRetainerIndex[nodeOrdinal + 1];
            for (let retainerIndex = beginRetainerIndex; retainerIndex < endRetainerIndex; ++retainerIndex) {
                let retainerEdgeIndex = retainingEdges[retainerIndex];
                let retainerEdgeType = containmentEdges[retainerEdgeIndex + edgeTypeOffset];
                if (retainerEdgeType !== edgeWeakType && retainerEdgeType !== edgeShortcutType)
                    return false;
            }
            return true;
        }

        // The algorithm is based on the article:
        // K. Cooper, T. Harvey and K. Kennedy "A Simple, Fast Dominance Algorithm"
        // Softw. Pract. Exper. 4 (2001), pp. 1-10.
        /**
         * @param {!Array.<number>} postOrderIndex2NodeOrdinal
         * @param {!Array.<number>} nodeOrdinal2PostOrderIndex
         */
        _buildDominatorTree(postOrderIndex2NodeOrdinal, nodeOrdinal2PostOrderIndex) {
            let nodeFieldCount = this._nodeFieldCount;
            let firstRetainerIndex = this._firstRetainerIndex;
            let retainingNodes = this._retainingNodes;
            let retainingEdges = this._retainingEdges;
            let edgeFieldsCount = this._edgeFieldsCount;
            let edgeTypeOffset = this._edgeTypeOffset;
            let edgeToNodeOffset = this._edgeToNodeOffset;
            let firstEdgeIndexes = this._firstEdgeIndexes;
            let containmentEdges = this.containmentEdges;
            let rootNodeIndex = this._rootNodeIndex;

            let mapAndFlag = this.userObjectsMapAndFlag();
            let flags = mapAndFlag ? mapAndFlag.map : null;
            let flag = mapAndFlag ? mapAndFlag.flag : 0;

            let nodesCount = postOrderIndex2NodeOrdinal.length;
            let rootPostOrderedIndex = nodesCount - 1;
            let noEntry = nodesCount;
            let dominators = new Uint32Array(nodesCount);
            for (let i = 0; i < rootPostOrderedIndex; ++i)
                dominators[i] = noEntry;
            dominators[rootPostOrderedIndex] = rootPostOrderedIndex;

            // The affected array is used to mark entries which dominators
            // have to be racalculated because of changes in their retainers.
            let affected = new Uint8Array(nodesCount);
            let nodeOrdinal;

            {  // Mark the root direct children as affected.
                nodeOrdinal = this._rootNodeIndex / nodeFieldCount;
                let endEdgeIndex = firstEdgeIndexes[nodeOrdinal + 1];
                for (let edgeIndex = firstEdgeIndexes[nodeOrdinal]; edgeIndex < endEdgeIndex; edgeIndex += edgeFieldsCount) {
                    let edgeType = containmentEdges[edgeIndex + edgeTypeOffset];
                    if (!this._isEssentialEdge(this._rootNodeIndex, edgeType))
                        continue;
                    let childNodeOrdinal = containmentEdges[edgeIndex + edgeToNodeOffset] / nodeFieldCount;
                    affected[nodeOrdinal2PostOrderIndex[childNodeOrdinal]] = 1;
                }
            }

            let changed = true;
            while (changed) {
                changed = false;
                for (let postOrderIndex = rootPostOrderedIndex - 1; postOrderIndex >= 0; --postOrderIndex) {
                    if (affected[postOrderIndex] === 0)
                        continue;
                    affected[postOrderIndex] = 0;
                    // If dominator of the entry has already been set to root,
                    // then it can't propagate any further.
                    if (dominators[postOrderIndex] === rootPostOrderedIndex)
                        continue;
                    nodeOrdinal = postOrderIndex2NodeOrdinal[postOrderIndex];
                    let nodeFlag = !flags || (flags[nodeOrdinal] & flag);
                    let newDominatorIndex = noEntry;
                    let beginRetainerIndex = firstRetainerIndex[nodeOrdinal];
                    let endRetainerIndex = firstRetainerIndex[nodeOrdinal + 1];
                    let orphanNode = true;
                    for (let retainerIndex = beginRetainerIndex; retainerIndex < endRetainerIndex; ++retainerIndex) {
                        let retainerEdgeIndex = retainingEdges[retainerIndex];
                        let retainerEdgeType = containmentEdges[retainerEdgeIndex + edgeTypeOffset];
                        let retainerNodeIndex = retainingNodes[retainerIndex];
                        if (!this._isEssentialEdge(retainerNodeIndex, retainerEdgeType))
                            continue;
                        orphanNode = false;
                        let retainerNodeOrdinal = retainerNodeIndex / nodeFieldCount;
                        let retainerNodeFlag = !flags || (flags[retainerNodeOrdinal] & flag);
                        // We are skipping the edges from non-page-owned nodes to page-owned nodes.
                        // Otherwise the dominators for the objects that also were retained by debugger would be affected.
                        if (retainerNodeIndex !== rootNodeIndex && nodeFlag && !retainerNodeFlag)
                            continue;
                        let retanerPostOrderIndex = nodeOrdinal2PostOrderIndex[retainerNodeOrdinal];
                        if (dominators[retanerPostOrderIndex] !== noEntry) {
                            if (newDominatorIndex === noEntry) {
                                newDominatorIndex = retanerPostOrderIndex;
                            } else {
                                while (retanerPostOrderIndex !== newDominatorIndex) {
                                    while (retanerPostOrderIndex < newDominatorIndex)
                                        retanerPostOrderIndex = dominators[retanerPostOrderIndex];
                                    while (newDominatorIndex < retanerPostOrderIndex)
                                        newDominatorIndex = dominators[newDominatorIndex];
                                }
                            }
                            // If idom has already reached the root, it doesn't make sense
                            // to check other retainers.
                            if (newDominatorIndex === rootPostOrderedIndex)
                                break;
                        }
                    }
                    // Make root dominator of orphans.
                    if (orphanNode)
                        newDominatorIndex = rootPostOrderedIndex;
                    if (newDominatorIndex !== noEntry && dominators[postOrderIndex] !== newDominatorIndex) {
                        dominators[postOrderIndex] = newDominatorIndex;
                        changed = true;
                        nodeOrdinal = postOrderIndex2NodeOrdinal[postOrderIndex];
                        let beginEdgeToNodeFieldIndex = firstEdgeIndexes[nodeOrdinal] + edgeToNodeOffset;
                        let endEdgeToNodeFieldIndex = firstEdgeIndexes[nodeOrdinal + 1];
                        for (let toNodeFieldIndex = beginEdgeToNodeFieldIndex; toNodeFieldIndex < endEdgeToNodeFieldIndex;
                            toNodeFieldIndex += edgeFieldsCount) {
                            let childNodeOrdinal = containmentEdges[toNodeFieldIndex] / nodeFieldCount;
                            affected[nodeOrdinal2PostOrderIndex[childNodeOrdinal]] = 1;
                        }
                    }
                }
            }

            let dominatorsTree = new Uint32Array(nodesCount);
            for (let postOrderIndex = 0, l = dominators.length; postOrderIndex < l; ++postOrderIndex) {
                nodeOrdinal = postOrderIndex2NodeOrdinal[postOrderIndex];
                dominatorsTree[nodeOrdinal] = postOrderIndex2NodeOrdinal[dominators[postOrderIndex]];
            }
            return dominatorsTree;
        }

        _calculateRetainedSizes(postOrderIndex2NodeOrdinal) {
            let nodeCount = this.nodeCount;
            let nodes = this.nodes;
            let nodeSelfSizeOffset = this._nodeSelfSizeOffset;
            let nodeFieldCount = this._nodeFieldCount;
            let dominatorsTree = this._dominatorsTree;
            let retainedSizes = this._retainedSizes;

            for (let nodeOrdinal = 0; nodeOrdinal < nodeCount; ++nodeOrdinal)
                retainedSizes[nodeOrdinal] = nodes[nodeOrdinal * nodeFieldCount + nodeSelfSizeOffset];

            // Propagate retained sizes for each node excluding root.
            for (let postOrderIndex = 0; postOrderIndex < nodeCount - 1; ++postOrderIndex) {
                let nodeOrdinal = postOrderIndex2NodeOrdinal[postOrderIndex];
                let dominatorOrdinal = dominatorsTree[nodeOrdinal];
                retainedSizes[dominatorOrdinal] += retainedSizes[nodeOrdinal];
            }
        }

        _buildDominatedNodes() {
            // Builds up two arrays:
            //  - "dominatedNodes" is a continuous array, where each node owns an
            //    interval (can be empty) with corresponding dominated nodes.
            //  - "indexArray" is an array of indexes in the "dominatedNodes"
            //    with the same positions as in the _nodeIndex.
            let indexArray = this._firstDominatedNodeIndex;
            // All nodes except the root have dominators.
            let dominatedNodes = this._dominatedNodes;

            // Count the number of dominated nodes for each node. Skip the root (node at
            // index 0) as it is the only node that dominates itself.
            let nodeFieldCount = this._nodeFieldCount;
            let dominatorsTree = this._dominatorsTree;

            let fromNodeOrdinal = 0;
            let toNodeOrdinal = this.nodeCount;
            let rootNodeOrdinal = this._rootNodeIndex / nodeFieldCount;
            if (rootNodeOrdinal === fromNodeOrdinal)
                fromNodeOrdinal = 1;
            else if (rootNodeOrdinal === toNodeOrdinal - 1)
                toNodeOrdinal = toNodeOrdinal - 1;
            else
                throw new Error('Root node is expected to be either first or last');
            for (let nodeOrdinal = fromNodeOrdinal; nodeOrdinal < toNodeOrdinal; ++nodeOrdinal)
                ++indexArray[dominatorsTree[nodeOrdinal]];
            // Put in the first slot of each dominatedNodes slice the count of entries
            // that will be filled.
            let firstDominatedNodeIndex = 0;
            for (let i = 0, l = this.nodeCount; i < l; ++i) {
                let dominatedCount = dominatedNodes[firstDominatedNodeIndex] = indexArray[i];
                indexArray[i] = firstDominatedNodeIndex;
                firstDominatedNodeIndex += dominatedCount;
            }
            indexArray[this.nodeCount] = dominatedNodes.length;
            // Fill up the dominatedNodes array with indexes of dominated nodes. Skip the root (node at
            // index 0) as it is the only node that dominates itself.
            for (let nodeOrdinal = fromNodeOrdinal; nodeOrdinal < toNodeOrdinal; ++nodeOrdinal) {
                let dominatorOrdinal = dominatorsTree[nodeOrdinal];
                let dominatedRefIndex = indexArray[dominatorOrdinal];
                dominatedRefIndex += (--dominatedNodes[dominatedRefIndex]);
                dominatedNodes[dominatedRefIndex] = nodeOrdinal * nodeFieldCount;
            }
        }

        _buildSamples() {
            let samples = this._rawSamples;
            if (!samples || !samples.length)
                return;
            let sampleCount = samples.length / 2;
            let sizeForRange = new Array(sampleCount);
            let timestamps = new Array(sampleCount);
            let lastAssignedIds = new Array(sampleCount);

            let timestampOffset = this._metaNode.sample_fields.indexOf('timestamp_us');
            let lastAssignedIdOffset = this._metaNode.sample_fields.indexOf('last_assigned_id');
            for (let i = 0; i < sampleCount; i++) {
                sizeForRange[i] = 0;
                timestamps[i] = (samples[2 * i + timestampOffset]) / 1000;
                lastAssignedIds[i] = samples[2 * i + lastAssignedIdOffset];
            }

            let nodes = this.nodes;
            let nodesLength = nodes.length;
            let nodeFieldCount = this._nodeFieldCount;
            let node = this.rootNode();
            for (let nodeIndex = 0; nodeIndex < nodesLength; nodeIndex += nodeFieldCount) {
                node.nodeIndex = nodeIndex;

                let nodeId = node.id();
                // JS objects have odd ids, skip native objects.
                if (nodeId % 2 === 0)
                    continue;
                let rangeIndex = lastAssignedIds.lowerBound(nodeId);
                if (rangeIndex === sampleCount) {
                    // TODO: make heap profiler not allocate while taking snapshot
                    continue;
                }
                sizeForRange[rangeIndex] += node.selfSize();
            }
            this._samples = new common.model.Samples(timestamps, lastAssignedIds, sizeForRange);
        }

        /**
         * @return {?common.model.Samples}
         */
        getSamples() {
            return this._samples;
        }

        /**
         * @protected
         */
        calculateFlags() {
            throw new Error('Not implemented');
        }

        /**
         * @protected
         */
        calculateStatistics() {
            throw new Error('Not implemented');
        }

        userObjectsMapAndFlag() {
            throw new Error('Not implemented');
        }

        /**
         * @param {string} baseSnapshotId
         * @param {!Object.<string, !common.model.AggregateForDiff>} baseSnapshotAggregates
         * @return {!Object.<string, !common.model.Diff>}
         */
        calculateSnapshotDiff(baseSnapshotId, baseSnapshotAggregates) {
            let snapshotDiff = this._snapshotDiffs[baseSnapshotId];
            if (snapshotDiff)
                return snapshotDiff;
            snapshotDiff = {};

            let aggregates = this.aggregates(true, 'allObjects');
            for (let className in baseSnapshotAggregates) {
                let baseAggregate = baseSnapshotAggregates[className];
                let diff = this._calculateDiffForClass(baseAggregate, aggregates[className]);
                if (diff)
                    snapshotDiff[className] = diff;
            }
            let emptyBaseAggregate = new common.model.AggregateForDiff();
            for (let className in aggregates) {
                if (className in baseSnapshotAggregates)
                    continue;
                snapshotDiff[className] = this._calculateDiffForClass(emptyBaseAggregate, aggregates[className]);
            }

            this._snapshotDiffs[baseSnapshotId] = snapshotDiff;
            return snapshotDiff;
        }

        /**
         * @param {!common.model.AggregateForDiff} baseAggregate
         * @param {!common.model.Aggregate} aggregate
         * @return {?common.model.Diff}
         */
        _calculateDiffForClass(baseAggregate, aggregate) {
            let baseIds = baseAggregate.ids;
            let baseIndexes = baseAggregate.indexes;
            let baseSelfSizes = baseAggregate.selfSizes;

            let indexes = aggregate ? aggregate.idxs : [];

            let i = 0, l = baseIds.length;
            let j = 0, m = indexes.length;
            let diff = new common.model.Diff();

            let nodeB = this.createNode(indexes[j]);
            while (i < l && j < m) {
                let nodeAId = baseIds[i];
                if (nodeAId < nodeB.id()) {
                    diff.deletedIndexes.push(baseIndexes[i]);
                    diff.removedCount++;
                    diff.removedSize += baseSelfSizes[i];
                    ++i;
                } else if (
                    nodeAId >
                    nodeB.id()) {  // Native nodes(e.g. dom groups) may have ids less than max JS object id in the base snapshot
                    diff.addedIndexes.push(indexes[j]);
                    diff.addedCount++;
                    diff.addedSize += nodeB.selfSize();
                    nodeB.nodeIndex = indexes[++j];
                } else {  // nodeAId === nodeB.id()
                    ++i;
                    nodeB.nodeIndex = indexes[++j];
                }
            }
            while (i < l) {
                diff.deletedIndexes.push(baseIndexes[i]);
                diff.removedCount++;
                diff.removedSize += baseSelfSizes[i];
                ++i;
            }
            while (j < m) {
                diff.addedIndexes.push(indexes[j]);
                diff.addedCount++;
                diff.addedSize += nodeB.selfSize();
                nodeB.nodeIndex = indexes[++j];
            }
            diff.countDelta = diff.addedCount - diff.removedCount;
            diff.sizeDelta = diff.addedSize - diff.removedSize;
            if (!diff.addedCount && !diff.removedCount)
                return null;
            return diff;
        }

        _nodeForSnapshotObjectId(snapshotObjectId) {
            for (let it = this._allNodes(); it.hasNext(); it.next()) {
                if (it.node.id() === snapshotObjectId)
                    return it.node;
            }
            return null;
        }

        /**
         * @param {string} snapshotObjectId
         * @return {?string}
         */
        nodeClassName(snapshotObjectId) {
            let node = this._nodeForSnapshotObjectId(snapshotObjectId);
            if (node)
                return node.className();
            return null;
        }

        /**
         * @param {string} name
         * @return {!Array.<number>}
         */
        idsOfObjectsWithName(name) {
            let ids = [];
            for (let it = this._allNodes(); it.hasNext(); it.next()) {
                if (it.item().name() === name)
                    ids.push(it.item().id());
            }
            return ids;
        }

        /**
         * @param {number} nodeIndex
         * @return {!HeapSnapshotWorker.HeapSnapshotEdgesProvider}
         */
        createEdgesProvider(nodeIndex) {
            let node = this.createNode(nodeIndex);
            let filter = this.containmentEdgesFilter();
            let indexProvider = new HeapSnapshotWorker.HeapSnapshotEdgeIndexProvider(this);
            return new HeapSnapshotWorker.HeapSnapshotEdgesProvider(this, filter, node.edges(), indexProvider);
        }

        /**
         * @param {number} nodeIndex
         * @param {?function(!HeapSnapshotWorker.HeapSnapshotEdge):boolean} filter
         * @return {!HeapSnapshotWorker.HeapSnapshotEdgesProvider}
         */
        createEdgesProviderForTest(nodeIndex, filter) {
            let node = this.createNode(nodeIndex);
            let indexProvider = new HeapSnapshotWorker.HeapSnapshotEdgeIndexProvider(this);
            return new HeapSnapshotWorker.HeapSnapshotEdgesProvider(this, filter, node.edges(), indexProvider);
        }

        /**
         * @return {?function(!HeapSnapshotWorker.HeapSnapshotEdge):boolean}
         */
        retainingEdgesFilter() {
            return null;
        }

        /**
         * @return {?function(!HeapSnapshotWorker.HeapSnapshotEdge):boolean}
         */
        containmentEdgesFilter() {
            return null;
        }

        /**
         * @param {number} nodeIndex
         * @return {!HeapSnapshotWorker.HeapSnapshotEdgesProvider}
         */
        createRetainingEdgesProvider(nodeIndex) {
            let node = this.createNode(nodeIndex);
            let filter = this.retainingEdgesFilter();
            let indexProvider = new HeapSnapshotWorker.HeapSnapshotRetainerEdgeIndexProvider(this);
            return new HeapSnapshotWorker.HeapSnapshotEdgesProvider(this, filter, node.retainers(), indexProvider);
        }

        /**
         * @param {string} baseSnapshotId
         * @param {string} className
         * @return {!HeapSnapshotWorker.HeapSnapshotNodesProvider}
         */
        createAddedNodesProvider(baseSnapshotId, className) {
            let snapshotDiff = this._snapshotDiffs[baseSnapshotId];
            let diffForClass = snapshotDiff[className];
            return new HeapSnapshotWorker.HeapSnapshotNodesProvider(this, null, diffForClass.addedIndexes);
        }

        /**
         * @param {!Array.<number>} nodeIndexes
         * @return {!HeapSnapshotWorker.HeapSnapshotNodesProvider}
         */
        createDeletedNodesProvider(nodeIndexes) {
            return new HeapSnapshotWorker.HeapSnapshotNodesProvider(this, null, nodeIndexes);
        }

        /**
         * @return {?function(!HeapSnapshotWorker.HeapSnapshotNode):boolean}
         */
        classNodesFilter() {
            return null;
        }

        /**
         * @param {string} className
         * @param {!common.model.NodeFilter} nodeFilter
         * @return {!HeapSnapshotWorker.HeapSnapshotNodesProvider}
         */
        createNodesProviderForClass(className, nodeFilter) {
            return new HeapSnapshotWorker.HeapSnapshotNodesProvider(
                this, this.classNodesFilter(), this.aggregatesWithFilter(nodeFilter)[className].idxs);
        }

        /**
         * @return {number}
         */
        _maxJsNodeId() {
            let nodeFieldCount = this._nodeFieldCount;
            let nodes = this.nodes;
            let nodesLength = nodes.length;
            let id = 0;
            for (let nodeIndex = this._nodeIdOffset; nodeIndex < nodesLength; nodeIndex += nodeFieldCount) {
                let nextId = nodes[nodeIndex];
                // JS objects have odd ids, skip native objects.
                if (nextId % 2 === 0)
                    continue;
                if (id < nextId)
                    id = nextId;
            }
            return id;
        }

        /**
         * @return {!common.model.StaticData}
         */
        updateStaticData() {
            return new common.model.StaticData(this.nodeCount, this._rootNodeIndex, this.totalSize, this._maxJsNodeId());
        }
    };

    /**
     * @unrestricted
     */
    let HeapSnapshotMetainfo = class {
        constructor() {
            // New format.
            this.node_fields = [];
            this.node_types = [];
            this.edge_fields = [];
            this.edge_types = [];
            this.trace_function_info_fields = [];
            this.trace_node_fields = [];
            this.sample_fields = [];
            this.type_strings = {};
        }
    };

    /**
     * @unrestricted
     */
    let HeapSnapshotHeader = class {
        constructor() {
            // New format.
            this.title = '';
            this.meta = new HeapSnapshotMetainfo();
            this.node_count = 0;
            this.edge_count = 0;
            this.trace_function_count = 0;
        }
    };

    /**
     * @unrestricted
     */
    HeapSnapshotWorker.HeapSnapshotItemProvider = class {
        /**
         * @param {!HeapSnapshotWorker.HeapSnapshotItemIterator} iterator
         * @param {!HeapSnapshotWorker.HeapSnapshotItemIndexProvider} indexProvider
         */
        constructor(iterator, indexProvider) {
            this._iterator = iterator;
            this._indexProvider = indexProvider;
            this._isEmpty = !iterator.hasNext();
            /** @type {?Array.<number>} */
            this._iterationOrder = null;
            this._currentComparator = null;
            this._sortedPrefixLength = 0;
            this._sortedSuffixLength = 0;
        }

        _createIterationOrder() {
            if (this._iterationOrder)
                return;
            this._iterationOrder = [];
            for (let iterator = this._iterator; iterator.hasNext(); iterator.next())
                this._iterationOrder.push(iterator.item().itemIndex());
        }

        /**
         * @return {boolean}
         */
        isEmpty() {
            return this._isEmpty;
        }

        /**
         * @param {number} begin
         * @param {number} end
         * @return {!common.model.ItemsRange}
         */
        serializeItemsRange(begin, end) {
            this._createIterationOrder();
            if (begin > end)
                throw new Error('Start position > end position: ' + begin + ' > ' + end);
            if (end > this._iterationOrder.length)
                end = this._iterationOrder.length;
            if (this._sortedPrefixLength < end && begin < this._iterationOrder.length - this._sortedSuffixLength) {
                this.sort(
                    this._currentComparator, this._sortedPrefixLength, this._iterationOrder.length - 1 - this._sortedSuffixLength,
                    begin, end - 1);
                if (begin <= this._sortedPrefixLength)
                    this._sortedPrefixLength = end;
                if (end >= this._iterationOrder.length - this._sortedSuffixLength)
                    this._sortedSuffixLength = this._iterationOrder.length - begin;
            }
            let position = begin;
            let count = end - begin;
            let result = new Array(count);
            for (let i = 0; i < count; ++i) {
                let itemIndex = this._iterationOrder[position++];
                let item = this._indexProvider.itemForIndex(itemIndex);
                result[i] = item.serialize();
            }
            return new common.model.ItemsRange(begin, end, this._iterationOrder.length, result);
        }

        sortAndRewind(comparator) {
            this._currentComparator = comparator;
            this._sortedPrefixLength = 0;
            this._sortedSuffixLength = 0;
        }
    };

    /**
     * @unrestricted
     */
    HeapSnapshotWorker.HeapSnapshotEdgesProvider = class extends HeapSnapshotWorker.HeapSnapshotItemProvider {
        /**
         * @param {!HeapSnapshotWorker.HeapSnapshot} snapshot
         * @param {?function(!HeapSnapshotWorker.HeapSnapshotEdge):boolean} filter
         * @param {!HeapSnapshotWorker.HeapSnapshotEdgeIterator} edgesIter
         * @param {!HeapSnapshotWorker.HeapSnapshotItemIndexProvider} indexProvider
         */
        constructor(snapshot, filter, edgesIter, indexProvider) {
            let iter = filter ?
                new HeapSnapshotWorker.HeapSnapshotFilteredIterator(
                    edgesIter, /** @type {function(!HeapSnapshotWorker.HeapSnapshotItem):boolean} */(filter)) :
                edgesIter;
            super(iter, indexProvider);
            this.snapshot = snapshot;
        }

        /**
         * @param {!common.model.ComparatorConfig} comparator
         * @param {number} leftBound
         * @param {number} rightBound
         * @param {number} windowLeft
         * @param {number} windowRight
         */
        sort(comparator, leftBound, rightBound, windowLeft, windowRight) {
            let fieldName1 = comparator.fieldName1;
            let fieldName2 = comparator.fieldName2;
            let ascending1 = comparator.ascending1;
            let ascending2 = comparator.ascending2;

            let edgeA = this._iterator.item().clone();
            let edgeB = edgeA.clone();
            let nodeA = this.snapshot.createNode();
            let nodeB = this.snapshot.createNode();

            function compareEdgeFieldName(ascending, indexA, indexB) {
                edgeA.edgeIndex = indexA;
                edgeB.edgeIndex = indexB;
                if (edgeB.name() === '__proto__')
                    return -1;
                if (edgeA.name() === '__proto__')
                    return 1;
                let result = edgeA.hasStringName() === edgeB.hasStringName() ?
                    (edgeA.name() < edgeB.name() ? -1 : (edgeA.name() > edgeB.name() ? 1 : 0)) :
                    (edgeA.hasStringName() ? -1 : 1);
                return ascending ? result : -result;
            }

            function compareNodeField(fieldName, ascending, indexA, indexB) {
                edgeA.edgeIndex = indexA;
                nodeA.nodeIndex = edgeA.nodeIndex();
                let valueA = nodeA[fieldName]();

                edgeB.edgeIndex = indexB;
                nodeB.nodeIndex = edgeB.nodeIndex();
                let valueB = nodeB[fieldName]();

                let result = valueA < valueB ? -1 : (valueA > valueB ? 1 : 0);
                return ascending ? result : -result;
            }

            function compareEdgeAndNode(indexA, indexB) {
                let result = compareEdgeFieldName(ascending1, indexA, indexB);
                if (result === 0)
                    result = compareNodeField(fieldName2, ascending2, indexA, indexB);
                if (result === 0)
                    return indexA - indexB;
                return result;
            }

            function compareNodeAndEdge(indexA, indexB) {
                let result = compareNodeField(fieldName1, ascending1, indexA, indexB);
                if (result === 0)
                    result = compareEdgeFieldName(ascending2, indexA, indexB);
                if (result === 0)
                    return indexA - indexB;
                return result;
            }

            function compareNodeAndNode(indexA, indexB) {
                let result = compareNodeField(fieldName1, ascending1, indexA, indexB);
                if (result === 0)
                    result = compareNodeField(fieldName2, ascending2, indexA, indexB);
                if (result === 0)
                    return indexA - indexB;
                return result;
            }

            if (fieldName1 === '!edgeName')
                this._iterationOrder.sortRange(compareEdgeAndNode, leftBound, rightBound, windowLeft, windowRight);
            else if (fieldName2 === '!edgeName')
                this._iterationOrder.sortRange(compareNodeAndEdge, leftBound, rightBound, windowLeft, windowRight);
            else
                this._iterationOrder.sortRange(compareNodeAndNode, leftBound, rightBound, windowLeft, windowRight);
        }
    };

    /**
     * @unrestricted
     */
    HeapSnapshotWorker.HeapSnapshotNodesProvider = class extends HeapSnapshotWorker.HeapSnapshotItemProvider {
        /**
         * @param {!HeapSnapshotWorker.HeapSnapshot} snapshot
         * @param {?function(!HeapSnapshotWorker.HeapSnapshotNode):boolean} filter
         * @param {(!Array.<number>|!Uint32Array)} nodeIndexes
         */
        constructor(snapshot, filter, nodeIndexes) {
            let indexProvider = new HeapSnapshotWorker.HeapSnapshotNodeIndexProvider(snapshot);
            let it = new HeapSnapshotWorker.HeapSnapshotIndexRangeIterator(indexProvider, nodeIndexes);

            if (filter) {
                it = new HeapSnapshotWorker.HeapSnapshotFilteredIterator(
                    it, /** @type {function(!HeapSnapshotWorker.HeapSnapshotItem):boolean} */(filter));
            }
            super(it, indexProvider);
            this.snapshot = snapshot;
        }

        /**
         * @param {string} snapshotObjectId
         * @return {number}
         */
        nodePosition(snapshotObjectId) {
            this._createIterationOrder();
            let node = this.snapshot.createNode();
            for (let i = 0; i < this._iterationOrder.length; i++) {
                node.nodeIndex = this._iterationOrder[i];
                if (node.id() === snapshotObjectId)
                    break;
            }
            if (i === this._iterationOrder.length)
                return -1;
            let targetNodeIndex = this._iterationOrder[i];
            let smallerCount = 0;
            let compare = this._buildCompareFunction(this._currentComparator);
            for (let i = 0; i < this._iterationOrder.length; i++) {
                if (compare(this._iterationOrder[i], targetNodeIndex) < 0)
                    ++smallerCount;
            }
            return smallerCount;
        }

        /**
         * @return {function(number,number):number}
         */
        _buildCompareFunction(comparator) {
            let nodeA = this.snapshot.createNode();
            let nodeB = this.snapshot.createNode();
            let fieldAccessor1 = nodeA[comparator.fieldName1];
            let fieldAccessor2 = nodeA[comparator.fieldName2];
            let ascending1 = comparator.ascending1 ? 1 : -1;
            let ascending2 = comparator.ascending2 ? 1 : -1;

            /**
             * @param {function():*} fieldAccessor
             * @param {number} ascending
             * @return {number}
             */
            function sortByNodeField(fieldAccessor, ascending) {
                let valueA = fieldAccessor.call(nodeA);
                let valueB = fieldAccessor.call(nodeB);
                return valueA < valueB ? -ascending : (valueA > valueB ? ascending : 0);
            }

            /**
             * @param {number} indexA
             * @param {number} indexB
             * @return {number}
             */
            function sortByComparator(indexA, indexB) {
                nodeA.nodeIndex = indexA;
                nodeB.nodeIndex = indexB;
                let result = sortByNodeField(fieldAccessor1, ascending1);
                if (result === 0)
                    result = sortByNodeField(fieldAccessor2, ascending2);
                return result || indexA - indexB;
            }

            return sortByComparator;
        }

        /**
         * @param {!common.model.ComparatorConfig} comparator
         * @param {number} leftBound
         * @param {number} rightBound
         * @param {number} windowLeft
         * @param {number} windowRight
         */
        sort(comparator, leftBound, rightBound, windowLeft, windowRight) {
            this._iterationOrder.sortRange(
                this._buildCompareFunction(comparator), leftBound, rightBound, windowLeft, windowRight);
        }
    };

    /**
     * @unrestricted
     */
    HeapSnapshotWorker.JSHeapSnapshot = class extends HeapSnapshotWorker.HeapSnapshot {
        /**
         * @param {!Object} profile
         * @param {!HeapSnapshotWorker.HeapSnapshotProgress} progress
         */
        constructor(profile, progress) {
            super(profile, progress);
            this._nodeFlags = {
                // bit flags
                canBeQueried: 1,
                detachedDOMTreeNode: 2,
                pageObject: 4  // The idea is to track separately the objects owned by the page and the objects owned by debugger.
            };
            // this.initialize();
            this._lazyStringCache = {};
        }

        /**
         * @override
         * @param {number=} nodeIndex
         * @return {!HeapSnapshotWorker.JSHeapSnapshotNode}
         */
        createNode(nodeIndex) {
            return new HeapSnapshotWorker.JSHeapSnapshotNode(this, nodeIndex === undefined ? -1 : nodeIndex);
        }

        /**
         * @override
         * @param {number} edgeIndex
         * @return {!HeapSnapshotWorker.JSHeapSnapshotEdge}
         */
        createEdge(edgeIndex) {
            return new HeapSnapshotWorker.JSHeapSnapshotEdge(this, edgeIndex);
        }

        /**
         * @override
         * @param {number} retainerIndex
         * @return {!HeapSnapshotWorker.JSHeapSnapshotRetainerEdge}
         */
        createRetainingEdge(retainerIndex) {
            return new HeapSnapshotWorker.JSHeapSnapshotRetainerEdge(this, retainerIndex);
        }

        /**
         * @override
         * @return {?function(!HeapSnapshotWorker.HeapSnapshotNode):boolean}
         */
        classNodesFilter() {
            let mapAndFlag = this.userObjectsMapAndFlag();
            if (!mapAndFlag)
                return null;
            let map = mapAndFlag.map;
            let flag = mapAndFlag.flag;

            /**
             * @param {!HeapSnapshotWorker.HeapSnapshotNode} node
             * @return {boolean}
             */
            function filter(node) {
                return !!(map[node.ordinal()] & flag);
            }

            return filter;
        }

        /**
         * @override
         * @return {function(!HeapSnapshotWorker.HeapSnapshotEdge):boolean}
         */
        containmentEdgesFilter() {
            return edge => !edge.isInvisible();
        }

        /**
         * @override
         * @return {function(!HeapSnapshotWorker.HeapSnapshotEdge):boolean}
         */
        retainingEdgesFilter() {
            let containmentEdgesFilter = this.containmentEdgesFilter();

            function filter(edge) {
                return containmentEdgesFilter(edge) && !edge.node().isRoot() && !edge.isWeak();
            }

            return filter;
        }

        /**
         * @override
         */
        calculateFlags() {
            this._flags = new Uint32Array(this.nodeCount);
            this._markDetachedDOMTreeNodes();
            this._markQueriableHeapObjects();
            this._markPageOwnedNodes();
        }

        /**
         * @override
         */
        calculateDistances() {
            /**
             * @param {!HeapSnapshotWorker.HeapSnapshotNode} node
             * @param {!HeapSnapshotWorker.HeapSnapshotEdge} edge
             * @return {boolean}
             */
            function filter(node, edge) {
                if (node.isHidden())
                    return edge.name() !== 'sloppy_function_map' || node.rawName() !== 'system / NativeContext';
                if (node.isArray()) {
                    // DescriptorArrays are fixed arrays used to hold instance descriptors.
                    // The format of the these objects is:
                    //   [0]: Number of descriptors
                    //   [1]: Either Smi(0) if uninitialized, or a pointer to small fixed array:
                    //          [0]: pointer to fixed array with enum cache
                    //          [1]: either Smi(0) or pointer to fixed array with indices
                    //   [i*3+2]: i-th key
                    //   [i*3+3]: i-th type
                    //   [i*3+4]: i-th descriptor
                    // As long as maps may share descriptor arrays some of the descriptor
                    // links may not be valid for all the maps. We just skip
                    // all the descriptor links when calculating distances.
                    // For more details see http://crbug.com/413608
                    if (node.rawName() !== '(map descriptors)')
                        return true;
                    let index = edge.name();
                    return index < 2 || (index % 3) !== 1;
                }
                return true;
            }

            super.calculateDistances(filter);
        }

        /**
         * @override
         * @protected
         * @param {!HeapSnapshotWorker.HeapSnapshotNode} node
         * @return {boolean}
         */
        isUserRoot(node) {
            return node.isUserRoot() || node.isDocumentDOMTreesRoot();
        }

        /**
         * @override
         * @param {function(!HeapSnapshotWorker.HeapSnapshotNode)} action
         * @param {boolean=} userRootsOnly
         */
        forEachRoot(action, userRootsOnly) {
            /**
             * @param {!HeapSnapshotWorker.HeapSnapshotNode} node
             * @param {string} name
             * @return {?HeapSnapshotWorker.HeapSnapshotNode}
             */
            function getChildNodeByName(node, name) {
                for (let iter = node.edges(); iter.hasNext(); iter.next()) {
                    let child = iter.edge.node();
                    if (child.name() === name)
                        return child;
                }
                return null;
            }

            let visitedNodes = {};

            /**
             * @param {!HeapSnapshotWorker.HeapSnapshotNode} node
             */
            function doAction(node) {
                let ordinal = node.ordinal();
                if (!visitedNodes[ordinal]) {
                    action(node);
                    visitedNodes[ordinal] = true;
                }
            }

            let gcRoots = getChildNodeByName(this.rootNode(), '(GC roots)');
            if (!gcRoots)
                return;

            if (userRootsOnly) {
                for (let iter = this.rootNode().edges(); iter.hasNext(); iter.next()) {
                    let node = iter.edge.node();
                    if (this.isUserRoot(node))
                        doAction(node);
                }
            } else {
                for (let iter = gcRoots.edges(); iter.hasNext(); iter.next()) {
                    let subRoot = iter.edge.node();
                    for (let iter2 = subRoot.edges(); iter2.hasNext(); iter2.next())
                        doAction(iter2.edge.node());
                    doAction(subRoot);
                }
                for (let iter = this.rootNode().edges(); iter.hasNext(); iter.next())
                    doAction(iter.edge.node());
            }
        }

        /**
         * @override
         * @return {?{map: !Uint32Array, flag: number}}
         */
        userObjectsMapAndFlag() {
            return { map: this._flags, flag: this._nodeFlags.pageObject };
        }

        /**
         * @param {!HeapSnapshotWorker.HeapSnapshotNode} node
         * @return {number}
         */
        _flagsOfNode(node) {
            return this._flags[node.nodeIndex / this._nodeFieldCount];
        }

        _markDetachedDOMTreeNodes() {
            let flag = this._nodeFlags.detachedDOMTreeNode;
            let detachedDOMTreesRoot;
            for (let iter = this.rootNode().edges(); iter.hasNext(); iter.next()) {
                let node = iter.edge.node();
                if (node.name() === '(Detached DOM trees)') {
                    detachedDOMTreesRoot = node;
                    break;
                }
            }

            if (!detachedDOMTreesRoot)
                return;

            let detachedDOMTreeRE = /^Detached DOM tree/;
            for (let iter = detachedDOMTreesRoot.edges(); iter.hasNext(); iter.next()) {
                let node = iter.edge.node();
                if (detachedDOMTreeRE.test(node.className())) {
                    for (let edgesIter = node.edges(); edgesIter.hasNext(); edgesIter.next())
                        this._flags[edgesIter.edge.node().nodeIndex / this._nodeFieldCount] |= flag;
                }
            }
        }

        _markQueriableHeapObjects() {
            // Allow runtime properties query for objects accessible from Window objects
            // via regular properties, and for DOM wrappers. Trying to access random objects
            // can cause a crash due to insonsistent state of internal properties of wrappers.
            let flag = this._nodeFlags.canBeQueried;
            let hiddenEdgeType = this._edgeHiddenType;
            let internalEdgeType = this._edgeInternalType;
            let invisibleEdgeType = this._edgeInvisibleType;
            let weakEdgeType = this._edgeWeakType;
            let edgeToNodeOffset = this._edgeToNodeOffset;
            let edgeTypeOffset = this._edgeTypeOffset;
            let edgeFieldsCount = this._edgeFieldsCount;
            let containmentEdges = this.containmentEdges;
            let nodeFieldCount = this._nodeFieldCount;
            let firstEdgeIndexes = this._firstEdgeIndexes;

            let flags = this._flags;
            let list = [];

            for (let iter = this.rootNode().edges(); iter.hasNext(); iter.next()) {
                if (iter.edge.node().isUserRoot())
                    list.push(iter.edge.node().nodeIndex / nodeFieldCount);
            }

            while (list.length) {
                let nodeOrdinal = list.pop();
                if (flags[nodeOrdinal] & flag)
                    continue;
                flags[nodeOrdinal] |= flag;
                let beginEdgeIndex = firstEdgeIndexes[nodeOrdinal];
                let endEdgeIndex = firstEdgeIndexes[nodeOrdinal + 1];
                for (let edgeIndex = beginEdgeIndex; edgeIndex < endEdgeIndex; edgeIndex += edgeFieldsCount) {
                    let childNodeIndex = containmentEdges[edgeIndex + edgeToNodeOffset];
                    let childNodeOrdinal = childNodeIndex / nodeFieldCount;
                    if (flags[childNodeOrdinal] & flag)
                        continue;
                    let type = containmentEdges[edgeIndex + edgeTypeOffset];
                    if (type === hiddenEdgeType || type === invisibleEdgeType || type === internalEdgeType || type === weakEdgeType)
                        continue;
                    list.push(childNodeOrdinal);
                }
            }
        }

        _markPageOwnedNodes() {
            let edgeShortcutType = this._edgeShortcutType;
            let edgeElementType = this._edgeElementType;
            let edgeToNodeOffset = this._edgeToNodeOffset;
            let edgeTypeOffset = this._edgeTypeOffset;
            let edgeFieldsCount = this._edgeFieldsCount;
            let edgeWeakType = this._edgeWeakType;
            let firstEdgeIndexes = this._firstEdgeIndexes;
            let containmentEdges = this.containmentEdges;
            let nodeFieldCount = this._nodeFieldCount;
            let nodesCount = this.nodeCount;

            let flags = this._flags;
            let pageObjectFlag = this._nodeFlags.pageObject;

            let nodesToVisit = new Uint32Array(nodesCount);
            let nodesToVisitLength = 0;

            let rootNodeOrdinal = this._rootNodeIndex / nodeFieldCount;
            let node = this.rootNode();

            // Populate the entry points. They are Window objects and DOM Tree Roots.
            for (let edgeIndex = firstEdgeIndexes[rootNodeOrdinal], endEdgeIndex = firstEdgeIndexes[rootNodeOrdinal + 1];
                edgeIndex < endEdgeIndex; edgeIndex += edgeFieldsCount) {
                let edgeType = containmentEdges[edgeIndex + edgeTypeOffset];
                let nodeIndex = containmentEdges[edgeIndex + edgeToNodeOffset];
                if (edgeType === edgeElementType) {
                    node.nodeIndex = nodeIndex;
                    if (!node.isDocumentDOMTreesRoot())
                        continue;
                } else if (edgeType !== edgeShortcutType) {
                    continue;
                }
                let nodeOrdinal = nodeIndex / nodeFieldCount;
                nodesToVisit[nodesToVisitLength++] = nodeOrdinal;
                flags[nodeOrdinal] |= pageObjectFlag;
            }

            // Mark everything reachable with the pageObject flag.
            while (nodesToVisitLength) {
                let nodeOrdinal = nodesToVisit[--nodesToVisitLength];
                let beginEdgeIndex = firstEdgeIndexes[nodeOrdinal];
                let endEdgeIndex = firstEdgeIndexes[nodeOrdinal + 1];
                for (let edgeIndex = beginEdgeIndex; edgeIndex < endEdgeIndex; edgeIndex += edgeFieldsCount) {
                    let childNodeIndex = containmentEdges[edgeIndex + edgeToNodeOffset];
                    let childNodeOrdinal = childNodeIndex / nodeFieldCount;
                    if (flags[childNodeOrdinal] & pageObjectFlag)
                        continue;
                    let type = containmentEdges[edgeIndex + edgeTypeOffset];
                    if (type === edgeWeakType)
                        continue;
                    nodesToVisit[nodesToVisitLength++] = childNodeOrdinal;
                    flags[childNodeOrdinal] |= pageObjectFlag;
                }
            }
        }

        /**
         * @override
         */
        calculateStatistics() {
            let nodeFieldCount = this._nodeFieldCount;
            let nodes = this.nodes;
            let nodesLength = nodes.length;
            let nodeTypeOffset = this._nodeTypeOffset;
            let nodeSizeOffset = this._nodeSelfSizeOffset;
            let nodeNativeType = this._nodeNativeType;
            let nodeCodeType = this._nodeCodeType;
            let nodeConsStringType = this._nodeConsStringType;
            let nodeSlicedStringType = this._nodeSlicedStringType;
            let distances = this._nodeDistances;
            let sizeNative = 0;
            let sizeCode = 0;
            let sizeStrings = 0;
            let sizeJSArrays = 0;
            let sizeSystem = 0;
            let node = this.rootNode();
            for (let nodeIndex = 0; nodeIndex < nodesLength; nodeIndex += nodeFieldCount) {
                let nodeSize = nodes[nodeIndex + nodeSizeOffset];
                let ordinal = nodeIndex / nodeFieldCount;
                if (distances[ordinal] >= common.model.baseSystemDistance) {
                    sizeSystem += nodeSize;
                    continue;
                }
                let nodeType = nodes[nodeIndex + nodeTypeOffset];
                node.nodeIndex = nodeIndex;
                if (nodeType === nodeNativeType)
                    sizeNative += nodeSize;
                else if (nodeType === nodeCodeType)
                    sizeCode += nodeSize;
                else if (nodeType === nodeConsStringType || nodeType === nodeSlicedStringType || node.type() === 'string')
                    sizeStrings += nodeSize;
                else if (node.name() === 'Array')
                    sizeJSArrays += this._calculateArraySize(node);
            }
            this._statistics = new common.model.Statistics();
            this._statistics.total = this.totalSize;
            this._statistics.v8heap = this.totalSize - sizeNative;
            this._statistics.native = sizeNative;
            this._statistics.code = sizeCode;
            this._statistics.jsArrays = sizeJSArrays;
            this._statistics.strings = sizeStrings;
            this._statistics.system = sizeSystem;
        }

        /**
         * @param {!HeapSnapshotWorker.HeapSnapshotNode} node
         * @return {number}
         */
        _calculateArraySize(node) {
            let size = node.selfSize();
            let beginEdgeIndex = node.edgeIndexesStart();
            let endEdgeIndex = node.edgeIndexesEnd();
            let containmentEdges = this.containmentEdges;
            let strings = this.strings;
            let edgeToNodeOffset = this._edgeToNodeOffset;
            let edgeTypeOffset = this._edgeTypeOffset;
            let edgeNameOffset = this._edgeNameOffset;
            let edgeFieldsCount = this._edgeFieldsCount;
            let edgeInternalType = this._edgeInternalType;
            for (let edgeIndex = beginEdgeIndex; edgeIndex < endEdgeIndex; edgeIndex += edgeFieldsCount) {
                let edgeType = containmentEdges[edgeIndex + edgeTypeOffset];
                if (edgeType !== edgeInternalType)
                    continue;
                let edgeName = strings[containmentEdges[edgeIndex + edgeNameOffset]];
                if (edgeName !== 'elements')
                    continue;
                let elementsNodeIndex = containmentEdges[edgeIndex + edgeToNodeOffset];
                node.nodeIndex = elementsNodeIndex;
                if (node.retainersCount() === 1)
                    size += node.selfSize();
                break;
            }
            return size;
        }

        /**
         * @return {!common.model.Statistics}
         */
        getStatistics() {
            return this._statistics;
        }
    };

    /**
     * @unrestricted
     */
    HeapSnapshotWorker.JSHeapSnapshotNode = class extends HeapSnapshotWorker.HeapSnapshotNode {
        /**
         * @param {!HeapSnapshotWorker.JSHeapSnapshot} snapshot
         * @param {number=} nodeIndex
         */
        constructor(snapshot, nodeIndex) {
            super(snapshot, nodeIndex);
        }

        /**
         * @return {boolean}
         */
        canBeQueried() {
            let flags = this._snapshot._flagsOfNode(this);
            return !!(flags & this._snapshot._nodeFlags.canBeQueried);
        }

        /**
         * @return {string}
         */
        rawName() {
            return super.name();
        }

        /**
         * @override
         * @return {string}
         */
        name() {
            let snapshot = this._snapshot;
            if (this.rawType() === snapshot._nodeConsStringType) {
                let string = snapshot._lazyStringCache[this.nodeIndex];
                if (typeof string === 'undefined') {
                    string = this._consStringName();
                    snapshot._lazyStringCache[this.nodeIndex] = string;
                }
                return string;
            }
            return this.rawName();
        }

        /**
         * @return {string}
         */
        _consStringName() {
            let snapshot = this._snapshot;
            let consStringType = snapshot._nodeConsStringType;
            let edgeInternalType = snapshot._edgeInternalType;
            let edgeFieldsCount = snapshot._edgeFieldsCount;
            let edgeToNodeOffset = snapshot._edgeToNodeOffset;
            let edgeTypeOffset = snapshot._edgeTypeOffset;
            let edgeNameOffset = snapshot._edgeNameOffset;
            let strings = snapshot.strings;
            let edges = snapshot.containmentEdges;
            let firstEdgeIndexes = snapshot._firstEdgeIndexes;
            let nodeFieldCount = snapshot._nodeFieldCount;
            let nodeTypeOffset = snapshot._nodeTypeOffset;
            let nodeNameOffset = snapshot._nodeNameOffset;
            let nodes = snapshot.nodes;
            let nodesStack = [];
            nodesStack.push(this.nodeIndex);
            let name = '';

            while (nodesStack.length && name.length < 1024) {
                let nodeIndex = nodesStack.pop();
                if (nodes[nodeIndex + nodeTypeOffset] !== consStringType) {
                    name += strings[nodes[nodeIndex + nodeNameOffset]];
                    continue;
                }
                let nodeOrdinal = nodeIndex / nodeFieldCount;
                let beginEdgeIndex = firstEdgeIndexes[nodeOrdinal];
                let endEdgeIndex = firstEdgeIndexes[nodeOrdinal + 1];
                let firstNodeIndex = 0;
                let secondNodeIndex = 0;
                for (let edgeIndex = beginEdgeIndex; edgeIndex < endEdgeIndex && (!firstNodeIndex || !secondNodeIndex);
                    edgeIndex += edgeFieldsCount) {
                    let edgeType = edges[edgeIndex + edgeTypeOffset];
                    if (edgeType === edgeInternalType) {
                        let edgeName = strings[edges[edgeIndex + edgeNameOffset]];
                        if (edgeName === 'first')
                            firstNodeIndex = edges[edgeIndex + edgeToNodeOffset];
                        else if (edgeName === 'second')
                            secondNodeIndex = edges[edgeIndex + edgeToNodeOffset];
                    }
                }
                nodesStack.push(secondNodeIndex);
                nodesStack.push(firstNodeIndex);
            }
            return name;
        }

        /**
         * @override
         * @return {string}
         */
        className() {
            let type = this.type();
            switch (type) {
                case 'hidden':
                    return '(system)';
                case 'object':
                case 'native':
                    return this.name();
                case 'code':
                    return '(compiled code)';
                default:
                    return '(' + type + ')';
            }
        }

        /**
         * @override
         * @return {number}
         */
        classIndex() {
            let snapshot = this._snapshot;
            let nodes = snapshot.nodes;
            let type = nodes[this.nodeIndex + snapshot._nodeTypeOffset];
            if (type === snapshot._nodeObjectType || type === snapshot._nodeNativeType)
                return nodes[this.nodeIndex + snapshot._nodeNameOffset];
            return -1 - type;
        }

        /**
         * @override
         * @return {number}
         */
        id() {
            let snapshot = this._snapshot;
            return snapshot.nodes[this.nodeIndex + snapshot._nodeIdOffset];
        }

        /**
         * @return {boolean}
         */
        isHidden() {
            return this.rawType() === this._snapshot._nodeHiddenType;
        }

        /**
         * @return {boolean}
         */
        isArray() {
            return this.rawType() === this._snapshot._nodeArrayType;
        }

        /**
         * @return {boolean}
         */
        isSynthetic() {
            return this.rawType() === this._snapshot._nodeSyntheticType;
        }

        /**
         * @return {boolean}
         */
        isUserRoot() {
            return !this.isSynthetic();
        }

        /**
         * @return {boolean}
         */
        isDocumentDOMTreesRoot() {
            return this.isSynthetic() && this.name() === '(Document DOM trees)';
        }

        /**
         * @override
         * @return {!common.model.Node}
         */
        serialize() {
            let result = super.serialize();
            let flags = this._snapshot._flagsOfNode(this);
            if (flags & this._snapshot._nodeFlags.canBeQueried)
                result.canBeQueried = true;
            if (flags & this._snapshot._nodeFlags.detachedDOMTreeNode)
                result.detachedDOMTreeNode = true;
            return result;
        }
    };

    /**
     * @unrestricted
     */
    HeapSnapshotWorker.JSHeapSnapshotEdge = class extends HeapSnapshotWorker.HeapSnapshotEdge {
        /**
         * @param {!HeapSnapshotWorker.JSHeapSnapshot} snapshot
         * @param {number=} edgeIndex
         */
        constructor(snapshot, edgeIndex) {
            super(snapshot, edgeIndex);
        }

        /**
         * @override
         * @return {!HeapSnapshotWorker.JSHeapSnapshotEdge}
         */
        clone() {
            let snapshot = /** @type {!HeapSnapshotWorker.JSHeapSnapshot} */ (this._snapshot);
            return new HeapSnapshotWorker.JSHeapSnapshotEdge(snapshot, this.edgeIndex);
        }

        /**
         * @override
         * @return {boolean}
         */
        hasStringName() {
            if (!this.isShortcut())
                return this._hasStringName();
            return isNaN(parseInt(this._name(), 10));
        }

        /**
         * @return {boolean}
         */
        isElement() {
            return this.rawType() === this._snapshot._edgeElementType;
        }

        /**
         * @return {boolean}
         */
        isHidden() {
            return this.rawType() === this._snapshot._edgeHiddenType;
        }

        /**
         * @return {boolean}
         */
        isWeak() {
            return this.rawType() === this._snapshot._edgeWeakType;
        }

        /**
         * @return {boolean}
         */
        isInternal() {
            return this.rawType() === this._snapshot._edgeInternalType;
        }

        /**
         * @return {boolean}
         */
        isInvisible() {
            return this.rawType() === this._snapshot._edgeInvisibleType;
        }

        /**
         * @return {boolean}
         */
        isShortcut() {
            return this.rawType() === this._snapshot._edgeShortcutType;
        }

        /**
         * @override
         * @return {string}
         */
        name() {
            let name = this._name();
            if (!this.isShortcut())
                return String(name);
            let numName = parseInt(name, 10);
            return String(isNaN(numName) ? name : numName);
        }

        /**
         * @override
         * @return {string}
         */
        toString() {
            let name = this.name();
            switch (this.type()) {
                case 'context':
                    return '->' + name;
                case 'element':
                    return '[' + name + ']';
                case 'weak':
                    return '[[' + name + ']]';
                case 'property':
                    return name.indexOf(' ') === -1 ? '.' + name : '["' + name + '"]';
                case 'shortcut':
                    if (typeof name === 'string')
                        return name.indexOf(' ') === -1 ? '.' + name : '["' + name + '"]';
                    else
                        return '[' + name + ']';
                case 'internal':
                case 'hidden':
                case 'invisible':
                    return '{' + name + '}';
            }
            return '?' + name + '?';
        }

        /**
         * @return {boolean}
         */
        _hasStringName() {
            let type = this.rawType();
            let snapshot = this._snapshot;
            return type !== snapshot._edgeElementType && type !== snapshot._edgeHiddenType;
        }

        /**
         * @return {string|number}
         */
        _name() {
            return this._hasStringName() ? this._snapshot.strings[this._nameOrIndex()] : this._nameOrIndex();
        }

        /**
         * @return {number}
         */
        _nameOrIndex() {
            return this._edges[this.edgeIndex + this._snapshot._edgeNameOffset];
        }

        /**
         * @override
         * @return {number}
         */
        rawType() {
            return this._edges[this.edgeIndex + this._snapshot._edgeTypeOffset];
        }
    };

    /**
     * @unrestricted
     */
    HeapSnapshotWorker.JSHeapSnapshotRetainerEdge = class extends HeapSnapshotWorker.HeapSnapshotRetainerEdge {
        /**
         * @param {!HeapSnapshotWorker.JSHeapSnapshot} snapshot
         * @param {number} retainerIndex
         */
        constructor(snapshot, retainerIndex) {
            super(snapshot, retainerIndex);
        }

        /**
         * @override
         * @return {!HeapSnapshotWorker.JSHeapSnapshotRetainerEdge}
         */
        clone() {
            let snapshot = /** @type {!HeapSnapshotWorker.JSHeapSnapshot} */ (this._snapshot);
            return new HeapSnapshotWorker.JSHeapSnapshotRetainerEdge(snapshot, this.retainerIndex());
        }

        /**
         * @return {boolean}
         */
        isHidden() {
            return this._edge().isHidden();
        }

        /**
         * @return {boolean}
         */
        isInternal() {
            return this._edge().isInternal();
        }

        /**
         * @return {boolean}
         */
        isInvisible() {
            return this._edge().isInvisible();
        }

        /**
         * @return {boolean}
         */
        isShortcut() {
            return this._edge().isShortcut();
        }

        /**
         * @return {boolean}
         */
        isWeak() {
            return this._edge().isWeak();
        }
    };

    return HeapSnapshotWorker;
}