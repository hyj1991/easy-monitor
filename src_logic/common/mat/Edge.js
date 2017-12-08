'use strict';
const HeapGraphEdgeType = {
  kContextVariable: 0,  // A variable from a function context.
  kElement: 1,          // An element of an array.
  kProperty: 2,         // A named object property.
  kernal: 3,         // A link that can't be accessed from JS,
  // thus, its name isn't a real property name
  // (e.g. parts of a ConsString).
  kHidden: 4,           // A link that is needed for proper sizes
  // calculation, but may be hidden from user.
  kShortcut: 5,         // A link that must not be followed during
  // sizes calculation.
  kWeak: 6              // A weak reference (ignored by the GC).
};

// Edge 类应当遵循请求成员方法的 id 总是 source index，而不是 ordinal index
class Edge {
  constructor(parser) {
    this.parser = parser;
  }

  /**
   * @param {Boolean} source true 表示源 index，false 表示处理后 index
   * @desc 获取 edge 类型
   * @return {String}
   */
  getType(id, source) {
    // 对于 edge 数组来说默认传入的就是 source index
    if (source === undefined || source === null) {
      source = true;
    }
    if (source && id % this.parser.edgeFiledLength !== 0) {
      throw new Error('Bad Edge Source ID');
    }
    const sourceEdgeIndex = source && id || id * this.parser.edgeFiledLength;
    const types = this.parser.edgeTypes;
    return types[this.parser.edges[sourceEdgeIndex + this.parser.edgeTypeOffset]];
  }

  /**
   * @param {Boolean} source true 表示源 index，false 表示处理后 index
   * @desc 获取 edge 指向的 node
   * @return {Number} 获取的为 edge 对应的 node 的 source index
   */
  getTargetNode(id, source) {
    // 对于 edge 数组来说默认传入的就是 source index
    if (source === undefined || source === null) {
      source = true;
    }
    if (source && id % this.parser.edgeFiledLength !== 0) {
      throw new Error('Bad Edge Source ID');
    }
    const sourceEdgeIndex = source && id || id * this.parser.edgeFiledLength;
    const targetNodeSourceIndex = this.parser.edges[sourceEdgeIndex + this.parser.edgeToNodeOffset];
    if (targetNodeSourceIndex % this.parser.nodeFieldLength !== 0) {
      throw new Error('Bad Edge To Node ID');
    }
    return targetNodeSourceIndex / this.parser.nodeFieldLength;
  }

  /**
   * @param {Boolean} source true 表示源 index，false 表示处理后 index
   * @desc 获取 edge 的 name_or_index
   * @return {String}
   */
  getNameOrIndex(id, source) {
    // 对于 edge 数组来说默认传入的就是 source index
    if (source === undefined || source === null) {
      source = true;
    }
    if (source && id % this.parser.edgeFiledLength !== 0) {
      throw new Error('Bad Edge Source ID');
    }
    const sourceEdgeIndex = source && id || id * this.parser.edgeFiledLength;
    const edgeType = this.parser.edges[sourceEdgeIndex];
    const edgeNameOrIndex = this.parser.edges[sourceEdgeIndex + this.parser.edgeNameOrIndexOffset];
    const name_or_index = edgeType === HeapGraphEdgeType.kElement ||
      edgeType === HeapGraphEdgeType.kHidden ? `[${edgeNameOrIndex}]` : `${this.parser.strings[edgeNameOrIndex]}`;
    return name_or_index;
  }
}

module.exports = Edge;