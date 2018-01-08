'use strict';

// Node 类应当遵循请求成员方法的 id 总是 ordinal index，而不是 source index
class Node {
  constructor(parser) {
    this.parser = parser;
  }

  /**
   * @desc 获取 ordinal id
   */
  getNodeId(source) {
    if (source % this.parser.nodeFieldLength !== 0) {
      throw new Error('Bad Node Source ID!');
    }
    return source / this.parser.nodeFieldLength;
  }

  /**
   * @param {Boolean} source true 表示源 index，false 表示处理后 index
   * @desc 获取 node 地址
   */
  getAddress(id, source) {
    if (source && id % this.parser.nodeFieldLength !== 0) {
      throw new Error('Bad Node Source ID!');
    }
    const nodeSourceIndex = source && id || id * this.parser.nodeFieldLength;
    return this.parser.nodes[nodeSourceIndex + this.parser.nodeAddressOffset];
  }

  /**
   * @param {Boolean} source true 表示源 index，false 表示处理后 index
   * @desc 获取 node 类型
   */
  getType(id, source) {
    if (source && id % this.parser.nodeFieldLength !== 0) {
      throw new Error('Bad Node Source ID!');
    }
    const nodeSourceIndex = source && id || id * this.parser.nodeFieldLength;
    const types = this.parser.nodeTypes;
    return types[this.parser.nodes[nodeSourceIndex + this.parser.nodeTypeOffset]];
  }

  /**
   * @param {Boolean} source true 表示源 index，false 表示处理后 index
   * @desc 获取 node 名称
   */
  getName(id, source) {
    if (source && id % this.parser.nodeFieldLength !== 0) {
      throw new Error('Bad Node Source ID!');
    }
    const nodeSourceIndex = source && id || id * this.parser.nodeFieldLength;
    const strings = this.parser.strings;
    return strings[this.parser.nodes[nodeSourceIndex + this.parser.nodeNameOffset]];
  }

  /**
   * @param {Boolean} source true 表示源 index，false 表示处理后 index
   * @desc 获取 node 下属 edge
   * @return {Array} 数组里面为每一个 edge 的第一个元素的 source index
   */
  getEdges(id, source) {
    if (source && id % this.parser.nodeFieldLength !== 0) {
      throw new Error('Bad Node Source ID!');
    }
    // 获取 node ordinal index
    const nodeOrdinalIndex = source && id / this.parser.nodeFieldLength || id;
    const firstEdgeIndex = this.parser.firstEdgeIndexs[nodeOrdinalIndex];
    const nextFirstEdgeIndex = this.parser.firstEdgeIndexs[nodeOrdinalIndex + 1] || this.parser.edges.length;
    const edges = [];
    for (let i = firstEdgeIndex; i < nextFirstEdgeIndex; i += this.parser.edgeFiledLength) {
      edges.push(i);
    }
    return edges;
  }

  /**
   * @param {Boolean} source true 表示源 index，false 表示处理后 index
   * @desc 获取 node 的 selfsize
   */
  getSelfSize(id, source) {
    if (source && id % this.parser.nodeFieldLength !== 0) {
      throw new Error('Bad Node Source ID!');
    }
    // 获取 node ordinal index
    const nodeSourceIndex = source && id || id * this.parser.nodeFieldLength;
    return this.parser.nodes[nodeSourceIndex + this.parser.nodeSelfSizeOffset];
  }

  /**
   * @param {Boolean} source true 表示源 index，false 表示处理后 index
   * @desc 获取 node 的 edge 数量
   */
  getEdgeCount(id, source) {
    if (source && id % this.parser.nodeFieldLength !== 0) {
      throw new Error('Bad Node Source ID!');
    }
    // 获取 node ordinal index
    const nodeSourceIndex = source && id || id * this.parser.nodeFieldLength;
    return this.parser.nodes[nodeSourceIndex + this.parser.nodeEdgeCountOffset];
  }
}

module.exports = Node;