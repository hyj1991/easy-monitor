'use strict';
const BitField = require('./BitField');
const Utils = require('./Utils');
const IntStack = require('./IntStack');
const ArrayUtils = require('./ArrayUtils');
const FlatDominatorTree = require('./FlatDominatorTree');

// 定义 class 内部常量
const ROOT_VALUE = -1;
const ROOT_VALUE_ARR = [ROOT_VALUE];

// 定义 class 内部变量
let snapshot;
let monitor;
let inboundIndex;
let outboundIndex;

let gcRootsArray = [];
let gcRootsSet;

let bucket = [];
let r, n;
let dom;
let parent;
let anchestor;
let vertex;
let label;
let semi;

function link(v, w) {
    anchestor[w] = v;
}

function compress(v) {
    let stack = new IntStack();
    while (anchestor[anchestor[v]] != 0) {
        stack.push(v);
        v = anchestor[v];
    }
    while (stack.getSize() > 0) {
        v = stack.pop();
        if (semi[label[anchestor[v]]] < semi[label[v]]) {
            label[v] = label[anchestor[v]];
        }
        anchestor[v] = anchestor[anchestor[v]];
    }
}

function privateEval(v) {
    if (anchestor[v] == 0) {
        return v;
    }
    else {
        compress(v);
        return label[v];
    }
}

function getPredecessors(v) {
    v -= 2;
    if (gcRootsSet.get(v)) {
        return ROOT_VALUE_ARR;
    }
    else {
        return inboundIndex[v];
    }
}

function dfs(root) {
    let capacity = 2047;
    let size = 0;
    let currentElementStack = new Array(capacity).fill(0);
    let currentSuccessorStack = new Array(capacity).fill(0);
    let successorsStack = new Array(capacity);

    let v = root;
    let successors = gcRootsArray;
    let currentSuccessor = 0;

    // 进行初始化操作
    currentElementStack[size] = root;
    successorsStack[size] = successors;
    currentSuccessorStack[size] = currentSuccessor;
    size++;

    while (size > 0) {
        v = currentElementStack[size - 1];
        successors = successorsStack[size - 1];
        currentSuccessor = currentSuccessorStack[size - 1];

        if (semi[v] == 0) {
            n = n + 1;
            semi[v] = n;
            vertex[n] = v;
            label[v] = v;
            anchestor[v] = 0;
        }

        if (currentSuccessor < successors.length) {
            let w = successors[currentSuccessor++] + 2;
            currentSuccessorStack[size - 1] = currentSuccessor;

            if (semi[w] == 0) {
                parent[w] = v;
                successors = outboundIndex[w - 2];

                if (size == capacity) {
                    let newCapacity = capacity << 1;
                    let newArr = new Array(newCapacity).fill(0);
                    Utils.arraycopy(currentElementStack, 0, newArr, 0, capacity);
                    currentElementStack = newArr;

                    newArr = new Array(newCapacity).fill(0);
                    Utils.arraycopy(currentSuccessorStack, 0, newArr, 0, capacity);
                    currentSuccessorStack = newArr;

                    let newSuccessorsArr = new Array(newCapacity);
                    Utils.arraycopy(successorsStack, 0, newSuccessorsArr, 0, capacity);
                    successorsStack = newSuccessorsArr;

                    capacity = newCapacity;
                }
                currentElementStack[size] = w;
                successorsStack[size] = successors;
                currentSuccessorStack[size] = 0;
                size++;
            }
        } else {
            size--;
        }
    }
}

class Calculator {
    constructor(snapshotparam, monitorparam) {
        this.numberOfObjects = snapshotparam.numberOfObjects;
        snapshot = snapshotparam;
        monitor = monitorparam;
        inboundIndex = snapshotparam.inboundIndexList;
        outboundIndex = snapshotparam.outboundIndexList;
        // 注意这里的 gcroots 已经去掉了无 map 或者隐式 map 的边和节点
        gcRootsArray = snapshotparam.gcRootsArray;
        gcRootsSet = new BitField(this.numberOfObjects);
        gcRootsArray.forEach(gcr => gcRootsSet.set(gcr));
        n = this.numberOfObjects + 1;
        r = 1;

        // 初始化使用到的数组
        parent = new Array(n + 1).fill(0);
        anchestor = new Array(n + 1).fill(0);
        vertex = new Array(n + 1).fill(0);
        label = new Array(n + 1).fill(0);
        semi = new Array(n + 1).fill(0);

        // 初始化分配，查看堆内存是否足够
        dom = new Array(n + 1).fill(0);
        bucket = new Array(n + 1).fill(0);
        dom = null;
        bucket = null;
    }

    /**
     * @description 计算 dominator tree 和 flat dominator tree，获取可疑内存泄漏点
     */
    compute() {
        n = 0;
        dfs(r);

        dom = new Array(this.numberOfObjects + 2).fill(0);
        bucket = new Array(this.numberOfObjects + 2).fill(-1);

        for (let i = n; i >= 2; i--) {
            let w = vertex[i];
            for (let v of getPredecessors(w)) {
                v += 2;
                if (v < 0) continue;
                let u = privateEval(v);
                if (semi[u] < semi[w]) {
                    semi[w] = semi[u];
                }
            }

            bucket[w] = bucket[vertex[semi[w]]];
            bucket[vertex[semi[w]]] = w;

            link(parent[w], w);

            let v = bucket[parent[w]];
            while (v != -1) {
                let u = privateEval(v);
                if (semi[u] < semi[v]) {
                    dom[v] = u;
                }
                else {
                    dom[v] = parent[w];
                }
                v = bucket[v]; // here bucket serves as next[]
            }
            bucket[parent[w]] = -1;
        }

        for (let i = 2; i <= n; i++) {
            let w = vertex[i];
            if (dom[w] != vertex[semi[w]]) {
                dom[w] = dom[dom[w]];
            }
        }
        dom[r] = 0;

        parent = anchestor = vertex = label = semi = bucket = null;

        // TODO: 这里还有个 dom 遍历算法，后期看看是否有必要移植
        let objectIds = new Array(this.numberOfObjects + 2);
        for (let i = 0; i < objectIds.length; i++) {
            objectIds[i] = i - 2;
        }
        objectIds[0] = -2;
        objectIds[1] = ROOT_VALUE;
        // 对 dom 结果进行排序
        ArrayUtils.sort(dom, objectIds, 2, dom.length - 2);
        // 空间换时间的做法，没办法，js 的 indexOf 操作效率实在是太低了
        // 这里如果用 indexof，性能爆降几百倍
        let dommap = dom.reduce((pre, next, index) => {
            pre[next] = index;
            return pre;
        }, {});
        // 对 dom 进行扁平化操作
        let tree = new FlatDominatorTree(snapshot, dom, objectIds, ROOT_VALUE, dommap);
        let topDominator = this.getTopDominator(tree);
        return { retainedSizes: tree.ts, topDominator };
    }

    getTopDominator(tree) {
        // 取出 tree 列表
        let successors = tree.getSuccessorsArr(-1);
        tree.sortByTotalSize(successors);
        return successors;
    }
}

module.exports = Calculator;