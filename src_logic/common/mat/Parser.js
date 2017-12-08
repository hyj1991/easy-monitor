'use strict';
const Node = require('./Node');
const Edge = require('./Edge');
const Identifier = require('./Identifier')

const ROOT_NODE_ID = 0;
const ROOT_NODE_OBJECT_ADDRESS = 1;

// 从 v8 里面抠出来的信息，如果 v8 更新掉就呵呵了
const GCRootInfo = {
  /**
   * GC root of unknown type, or a type not matching any of the other declared types
   */
  UNKNOWN: 1,
  /**
   * Class loaded by system class loader, e.g. java.lang.String
   */
  SYSTEM_CLASS: 2,
  /**
   * Local variable in native code
   */
  NATIVE_LOCAL: 4,
  /**
   * Global variable in native code
   */
  NATIVE_STATIC: 8,
  /**
   * Started but not stopped threads
   * @see #THREAD_OBJ
   */
  THREAD_BLOCK: 16,
  /**
   * Everything you have called wait() or notify() on or you have
   * synchronized on
   */
  BUSY_MONITOR: 32,
  /**
   * Local variable, i.e. method input parameters or locally created
   * objects of methods still on the stack of a thread
   */
  JAVA_LOCAL: 64,
  /**
   * In or out parameters in native code; frequently seen as some methods
   * have native parts and the objects handled as method parameters become
   * GC roots, e.g. parameters used for file/network I/O methods or
   * reflection
   */
  NATIVE_STACK: 128,
  /**
   * Running or blocked Java threads
   */
  THREAD_OBJ: 256,
  /**
   * An object which is a queue awaiting its finalizer to be run
   * @see #THREAD_BLOCK
   */
  FINALIZABLE: 512,
  /**
   * An object which has a finalize method, but has not been finalized and
   * is not yet on the finalizer queue
   */
  UNFINALIZED: 1024,
  /**
   * An object which is unreachable from any other root, but has been 
   * marked as a root by MAT to retain objects which otherwise would not
   * be included in the analysis
   * @since 1.0
   */
  UNREACHABLE: 2048,
  /**
   * A Java stack frame containing references to Java locals
   * @since 1.0
   */
  JAVA_STACK_FRAME: 4096,

  JS_SYSTEM_OBJ: 1 << 13,
  JS_LOCAL: 1 << 14,
  JS_BINDING_LOCAL: 1 << 15,
  JS_BINDING_GLOBAL: 1 << 16
};

const GCRootType = {
  '(Internalized strings)': { desc: "kStringTable", value: -1 },
  '(External strings)': { desc: "kExternalStringsTable", value: -1 },
  '(Smi roots)': { desc: 'kSmiRootList', vallue: -1 },
  '(Strong roots)': { desc: 'kStrongRootList', value: GCRootInfo.JS_SYSTEM_OBJ },
  '(Internal string)': { desc: 'kInternalizedString', value: GCRootInfo.JS_SYSTEM_OBJ },
  '(Bootstrapper)': { desc: 'kBootstrapper', value: GCRootInfo.JS_SYSTEM_OBJ },
  '(Isolate)': { desc: 'kTop', value: GCRootInfo.JS_LOCAL },
  '(Relocatable)': { desc: 'kRelocatable', value: GCRootInfo.JS_SYSTEM_OBJ },
  '(Debugger)': { desc: 'kDebug', value: GCRootInfo.JS_SYSTEM_OBJ },
  '(Compilation cache)': { desc: 'kCompilationCache', value: GCRootInfo.JS_SYSTEM_OBJ },
  '(Handle scope)': { desc: 'kHandleScope', value: GCRootInfo.JS_BINDING_LOCAL },
  '(Builtins)': { desc: 'kBuiltins', value: GCRootInfo.JS_SYSTEM_OBJ },
  '(Global handles)': { desc: 'kGlobalHandles', value: GCRootInfo.JS_BINDING_GLOBAL },
  '(Eternal handles)': { desc: 'kEternalHandles', value: GCRootInfo.JS_BINDING_GLOBAL },
  '(Strong roots)': { desc: 'kStrongRoots', value: GCRootInfo.JS_SYSTEM_OBJ },
  '(Extensions)': { desc: 'kExtensions', value: GCRootInfo.JS_SYSTEM_OBJ },
  '': { desc: 'kUnidentified', value: GCRootInfo.UNKNOWN }
}

class Parser {
  constructor(profile) {
    const snapshot = profile.snapshot;
    // 获取 strings 数组
    this.strings = profile.strings;
    // 获取 nodes 数组和 edges 数组
    this.nodes = profile.nodes;
    this.edges = profile.edges;
    // 获取 root id
    this.rootNodeIndex = ROOT_NODE_ID;
    if (profile.snapshot.root_index) {
      this.rootNodeIndex = profile.snapshot.root_index;
    }
    // 获取每一个 node 和 edge 的真实长度
    this.nodeFieldLength = snapshot.meta.node_fields.length;
    this.edgeFiledLength = snapshot.meta.edge_fields.length;
    //获取 nodes 和 edges 个数
    this.nodeCount = this.nodes.length / this.nodeFieldLength;
    this.edgeCount = this.edges.length / this.edgeFiledLength;
    // 获取 node 和 edge 类型
    this.nodeTypes = snapshot.meta.node_types[0];
    this.edgeTypes = snapshot.meta.edge_types[0];
    // 获取 node 描述 offset
    this.nodeTypeOffset = snapshot.meta.node_fields.indexOf('type');
    this.nodeNameOffset = snapshot.meta.node_fields.indexOf('name');
    this.nodeAddressOffset = snapshot.meta.node_fields.indexOf('id');
    this.nodeSelfSizeOffset = snapshot.meta.node_fields.indexOf('self_size');
    this.nodeEdgeCountOffset = snapshot.meta.node_fields.indexOf('edge_count');
    this.nodeTraceNodeIdOffset = snapshot.meta.node_fields.indexOf('trace_node_id');
    // 获取 edge 描述 offset
    this.edgeTypeOffset = snapshot.meta.edge_fields.indexOf('type');
    this.edgeNameOrIndexOffset = snapshot.meta.edge_fields.indexOf('name_or_index');
    this.edgeToNodeOffset = snapshot.meta.edge_fields.indexOf('to_node');

    // 获取 node 下属第一个 edge 对应的 edge index
    this.edgeFromNodeIndexs = [];
    this.firstEdgeIndexs = this.getFirstEdgeIndexs();

    // 设置 Node 和 Edge 的公共方法
    this.nodeUtil = new Node(this);
    this.edgeUtil = new Edge(this);

    // 临时中间变量
    this.identifiers = new Identifier();
    this.namedRoots = new Map();
    this.hasMap = new Array(this.nodeCount).fill(false);
    this.implicitMap = new Array(this.nodeCount).fill(0);
    this.indirectSize = new Array(this.nodeCount).fill(-1);

    // 过滤后真实的 node id 映射到 ordinal id 数组
    this.realNode2OrdinalNode = new Array(this.nodeCount).fill(-1);
    this.ordinalNode2realNode = new Array(this.nodeCount).fill(-1);

    // 计算可疑泄漏点使用到的数据
    this.realNodeCount = 0;
    this.inboundIndexList = [];
    this.outboundIndexList = [];
    this.gcRoots = [];
    this.heapSizeList = [];
    this.retainedSizes = [];
  }

  /**
   * @desc 获取 node 下属第一个 edge 对应的 edge index
   */
  getFirstEdgeIndexs() {
    const firstEdgeIndexes = new Uint32Array(this.nodeCount);
    for (let nodeOrdinal = 0, edgeIndex = 0; nodeOrdinal < this.nodeCount; ++nodeOrdinal) {
      firstEdgeIndexes[nodeOrdinal] = edgeIndex;
      const offset = this.nodes[nodeOrdinal * this.nodeFieldLength + this.nodeEdgeCountOffset] * this.edgeFiledLength;
      for (let i = edgeIndex; i < (edgeIndex + offset); i += this.edgeFiledLength) {
        this.edgeFromNodeIndexs.push(nodeOrdinal);
      }
      edgeIndex += offset;
    }
    return firstEdgeIndexes;
  }

  /**
   * @desc 解析 snapshot
   */
  init() {
    // 1.
    this.readRoots();
    this.readMaps();
    this.reportInstances();
    // 2.
    // this.identifiers.sort();
    this.readNodes();
    // TODO: 这里没有把 unreachable 的节点加入 gcroots，最妥善的做法还是要加上，待补充
    this.map2ids();
  }

  getLeakMap(bigobjectId) {
    const MAX_DEPTH = 100;
    let nodeSourceId = this.realNode2OrdinalNode[bigobjectId];
    let leakMap = [bigobjectId];
    let nowDepth = 0;
    let parentSize = this.retainedSizes[bigobjectId + 2];
    let bigChild = this.getChildsDetail(nodeSourceId);
    if (bigChild.length === 0) {
      return [];
    }
    bigChild = bigChild[0];
    while (nowDepth < MAX_DEPTH && (bigChild.retainedSize / parentSize > 0.7)) {
      nowDepth++;
      leakMap.push(bigChild.realId);
      parentSize = bigChild.retainedSize;
      bigChild = this.getChildsDetail(bigChild.targetNode);
      if (bigChild.length === 0) {
        break;
      }
      bigChild = bigChild[0];
    }
    return leakMap;
  }

  getChildsDetail(parentId) {
    let details = [];
    let edges = this.nodeUtil.getEdges(parentId);
    for (let edge of edges) {
      let targetNode = this.edgeUtil.getTargetNode(edge);
      let realId = this.ordinalNode2realNode[targetNode];
      if (realId === -1) {
        throw new Error('Bad Parent Id!');
      }
      details.push({ edge, targetNode, realId, retainedSize: this.retainedSizes[realId + 2] });
    }
    details.sort((o, n) => Number(o.retainedSize) < Number(n.retainedSize) ? 1 : -1);
    return details;
  }

  getRealNodeInfo(realId, type) {
    const nodeSourceId = this.realNode2OrdinalNode[realId];
    if (!realId || nodeSourceId === -1) {
      throw new Error("Bad Real Node Id");
    }

    switch (type) {
      case 'name':
        return this.nodeUtil.getName(nodeSourceId);
        break;
      case 'address':
        return this.nodeUtil.getAddress(nodeSourceId);
        break;
      case 'ordinal':
        return nodeSourceId;
        break;
      default:
        return {
          name: this.nodeUtil.getName(nodeSourceId),
          address: this.nodeUtil.getAddress(nodeSourceId),
          ordinal: nodeSourceId
        }
        break;
    }
  }

  /**
   * @desc 获取 gc roots
   */
  readRoots() {
    const rootAddress = this.nodeUtil.getAddress(this.rootNodeIndex);
    // 合法的 snapshot root 节点地址必为 1，当然如果以后内核序列化 snapshot 格式改了就呵呵了，先这样吧
    if (rootAddress !== ROOT_NODE_OBJECT_ADDRESS) {
      throw new Error('Snapshot Error');
    }
    const rootEdges = this.nodeUtil.getEdges(this.rootNodeIndex);
    let GCStrongRootsNode = null;
    for (let edge of rootEdges) {
      // 忽略掉真实 root 的 shortcut 边
      if (this.edgeUtil.getType(edge) === 'shortcut') {
        continue;
      }
      // 找到 gc roots 后直接结束
      if (GCStrongRootsNode !== null) {
        continue;
      }
      GCStrongRootsNode = this.edgeUtil.getTargetNode(edge);
    }

    // 初步获取第一层 gc roots，去掉 initialized strings 等非 root 节点
    const nodeToRootType = new Map();
    const strongRootsEdges = this.nodeUtil.getEdges(GCStrongRootsNode);
    for (let edge of strongRootsEdges) {
      const ordinalNode = this.edgeUtil.getTargetNode(edge);
      const nodeName = this.nodeUtil.getName(ordinalNode);
      const value = GCRootType[nodeName] && GCRootType[nodeName].value || GCRootType[''].value;;
      if (value != -1) {
        nodeToRootType.set(ordinalNode, GCRootType[nodeName] || GCRootType['']);
      }
    }

    let foundNull = false;
    let foundTheHole = false;
    nodeToRootType.forEach((v, k) => {
      let edges = this.nodeUtil.getEdges(k);
      for (let edge of edges) {
        let targetNode = this.edgeUtil.getTargetNode(edge);
        let edgeType = this.edgeUtil.getType(edge);
        let nodeType = this.nodeUtil.getType(targetNode);
        if (edgeType === 'shortcut' || nodeType === 'synthetic') {
          throw new Error('V8 Error');
        }
        if (edgeType === 'weak') {
          continue;
        }
        let rootName = null;
        if (edgeType == 'internal') {
          rootName = this.edgeUtil.getNameOrIndex(edge);
          if (rootName === 'null_value') foundNull = true;
          if (rootName === 'the_hole_value') foundTheHole = true;
          // kBuiltins 指向的代码都会被 TagBuiltinCodeObject 到，参见 RootsReferencesExtractor::FillReferences。
        } else if (v && v.desc == 'kBuiltins') {
          rootName = this.nodeUtil.getName(targetNode);
        }
        // 聊胜于无
        if (rootName === null) {
          // rootName = this.edgeUtil.getNameOrIndex(edge);
        }
        this.addGCRoot(this.nodeUtil.getAddress(targetNode), v.value, rootName);
      }
    });

    if (!foundNull) {
      this.addGCRoot(this.namedRoots.get('instanceof_cache_answer'), GCRootInfo.JS_SYSTEM_OBJ, 'null_value');
    }
    if (!foundTheHole) {
      this.addGCRoot(this.namedRoots.get('instanceof_cache_map'), GCRootInfo.JS_SYSTEM_OBJ, 'the_hole_value');
    }
  }

  /**
   * @desc 设置 gc root
   */
  addGCRoot(address, gctype, rootname) {
    if (rootname != null) {
      this.namedRoots.set(rootname, address);
    }
    if (!~this.gcRoots.indexOf(address)) {
      this.gcRoots.push(address);
    }
  }

  /**
   * @desc 获取 map
   */
  readMaps() {
    for (let edgeOrdinalId = 0; edgeOrdinalId < this.edgeCount; edgeOrdinalId++) {
      const edgeSourceIndex = edgeOrdinalId * this.edgeFiledLength;
      const edgeType = this.edgeUtil.getType(edgeSourceIndex);
      const edgeName = this.edgeUtil.getNameOrIndex(edgeSourceIndex);
      // 忽略掉非 map 边
      if (!(edgeType === 'internal' && edgeName === 'map')) {
        continue;
      }
      const targetNode = this.edgeUtil.getTargetNode(edgeSourceIndex);
      const address = this.nodeUtil.getAddress(targetNode);
      const fromNode = this.edgeFromNodeIndexs[edgeOrdinalId];
      // 标明此 node 存在 map 边
      this.hasMap[fromNode] = true;
    }
  }

  reportInstances() {
    let fixedArrayMapAddress = this.namedRoots.get('fixed_array_map');
    let sharedFunctionInfoMapAddress = this.namedRoots.get('shared_function_info_map');
    let cellMapAddress = this.namedRoots.get('cell_map');
    let globalPropertyCellMapAddress = this.namedRoots.get('global_property_cell_map');

    let isEmpty = true;
    for (let nodeOrdinalId = 0; nodeOrdinalId < this.nodeCount; nodeOrdinalId++) {
      if (this.hasMap[nodeOrdinalId]) {
        isEmpty = false;
        this.identifiers.add(this.nodeUtil.getAddress(nodeOrdinalId));
        continue;
      }
      const nodeType = this.nodeUtil.getType(nodeOrdinalId);
      const nodeName = this.nodeUtil.getName(nodeOrdinalId);
      const nodeSelfSize = this.nodeUtil.getSelfSize(nodeOrdinalId);
      let type = nodeType != null ? nodeType : 'hidden';
      switch (type) {
        case 'array':
          this.implicitMap[nodeOrdinalId] = fixedArrayMapAddress;
          break;
        case 'code':
          this.implicitMap[nodeOrdinalId] = sharedFunctionInfoMapAddress;
          break;
        case 'hidden':
          if (nodeName == 'system / Cell') {
            this.implicitMap[nodeOrdinalId] = cellMapAddress;
          } else if (nodeName == 'system / PropertyCell') {
            this.implicitMap[nodeOrdinalId] = globalPropertyCellMapAddress;
          } else {
            continue;
          }
          break;
        case 'native':
          this.indirectSize[nodeOrdinalId] = nodeSelfSize;
          continue;
        default:
          continue;
      }

      isEmpty = false;
      this.identifiers.add(this.nodeUtil.getAddress(nodeOrdinalId));
    }
    // 不可能为空
    if (isEmpty) {
      throw new Error('SnapshotException');
    }
  }

  /**
   * @desc 获取过滤后的 nodes
   */
  readNodes() {
    let ignoredNodes = 0;
    let firstIgnoredNodeEdgeId = -1;
    let firstIgnoredObjectAddress = -1;
    let objectId = 0;
    for (let nodeOrdinalId = 0; nodeOrdinalId < this.nodeCount; nodeOrdinalId++) {
      if (!this.hasMap[nodeOrdinalId] && this.implicitMap[nodeOrdinalId] == 0) {
        const nodeType = this.nodeUtil.getType(nodeOrdinalId);
        if (nodeType == 'synthetic' || this.indirectSize[nodeOrdinalId] != -1) {
          continue;
        }
        if (firstIgnoredObjectAddress == -1) {
          firstIgnoredObjectAddress = this.nodeUtil.getAddress(nodeOrdinalId);
          firstIgnoredNodeEdgeId = this.firstEdgeIndexs[nodeOrdinalId];
        }
        ignoredNodes++;
        continue;
      }
      let objectAddress = this.nodeUtil.getAddress(nodeOrdinalId);
      objectId = this.identifiers.reverse(objectAddress);
      this.realNode2OrdinalNode[objectId] = nodeOrdinalId;
      this.ordinalNode2realNode[nodeOrdinalId] = objectId;
      const newReferences = this.readEdges(nodeOrdinalId, objectId);
      // 获取过滤后真实的 node outbound list
      this.outboundIndexList[objectId] = this.log(newReferences);
      // 获取过滤后真实的 node self size list
      this.heapSizeList[objectId] = this.nodeUtil.getSelfSize(nodeOrdinalId);
    }
    // 获取过滤后真实的 node 节点数
    this.realNodeCount = objectId + 1;
  }

  readEdges(nodeOrdinalId, objectId) {
    let usedHeapSize = 0;
    let edges = this.nodeUtil.getEdges(nodeOrdinalId);
    let newReferences = [];
    for (let edge of edges) {
      let targetNode = this.edgeUtil.getTargetNode(edge);
      let edgeType = this.edgeUtil.getType(edge);
      let edgeName = this.edgeUtil.getNameOrIndex(edge);
      let targetNodeType = this.nodeUtil.getType(targetNode);
      let targetNodeId = targetNode;
      let targetNodeAddress = this.nodeUtil.getAddress(targetNode);

      // 忽略掉 shortcut、weak 边以及指向 synthetic 节点的边
      if (edgeType == 'shortcut' || edgeType == 'weak' || targetNodeType == 'synthetic') {
        continue;
      }
      if (this.indirectSize[targetNodeId] != -1) {
        usedHeapSize += this.indirectSize[targetNodeId];
        continue;
      }
      if (!this.hasMap[targetNodeId] && this.implicitMap[targetNodeId] == 0) {
        continue;
      }

      // 这里处理是为了把第一条边设置为 map 边，由于之前已经排除掉了没有 map 边的情况，所以一定会存在
      if (edgeType === 'internal' && edgeName === 'map') {
        newReferences.unshift(targetNodeAddress);
      } else {
        newReferences.push(targetNodeAddress);
      }
    }
    return newReferences;
  }

  log(references) {
    let pseudo = references[0];
    // 按照自增进行排序（所谓的升序）
    references.sort((o, n) => Number(o) < Number(n) ? -1 : 1);

    let objectIds = new Array(references.length).fill(0);
    let length = 1;

    let current = 0;
    let last = references[0] - 1;
    for (let ii = 0; ii < objectIds.length; ii++) {
      current = references[ii];
      if (last != current) {
        let objectIdTmp = this.identifiers.reverse(current);
        if (objectIdTmp >= 0) {
          let jj = (current == pseudo) ? 0 : length++;
          objectIds[jj] = objectIdTmp;
        }
      }
      last = current;
    }
    return objectIds;
  }

  map2ids() {
    let newRoots = [];
    for (let old of this.gcRoots) {
      let idx = this.identifiers.reverse(old);
      newRoots.push(idx);
    }
    this.gcRoots = newRoots;
  }

  // createOutbound(objectId, references) {
  //   let pseudo = references[0];
  //   // 按照自增进行排序
  //   references.sort((o, n) => Number(o) < Number(n) ? -1 : 1);

  //   let objectIds = new Array(references.length).fill(0);
  //   let length = 1;

  //   let current = 0;
  //   let last = references[0] - 1;
  //   for (let ii = 0; ii < objectIds.length; ii++) {
  //     current = references[ii];
  //     if (last != current) {
  //       let objectIdTmp = this.identifiers.reverse(current);
  //       if (objectIdTmp >= 0) {
  //         let jj = (current == pseudo) ? 0 : length++;
  //         objectIds[jj] = objectIdTmp;
  //       }
  //     }
  //     last = current;
  //   }
  //   this.outboundIndexList[objectId] = objectIds;
  // }
}

module.exports = Parser;