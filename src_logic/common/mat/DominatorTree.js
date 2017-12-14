'use strict';
const Calculator = require('./Calculator');

// 构建 Dominator Tree
class DominatorTree {
    constructor(snapshot, listener) {
        this.snapshot = snapshot;
        this.listener = listener;
    }

    calculate() {
        // 计算 heapsnapshot
        return new Calculator(this.snapshot, this.listener).compute();
    }
}

module.exports = DominatorTree;