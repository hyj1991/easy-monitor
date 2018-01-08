'use strict';
const Utils = require('./Utils');
const ArrayUtils = require('./ArrayUtils');
const LongIndexCollector = require('./LongIndexCollector');
const TEMP_ARR_LENGTH = 1000000;

let dom = [];
let dommap = {};
let elements = [];
let ts = [];
let dump;

let tempIntArray = new Array(TEMP_ARR_LENGTH).fill(0);

function calculateTotalSizesIterative(e) {
    let retained = new LongIndexCollector(dump.numberOfObjects);

    let capacity = 2047;
    let size = 0;
    let stack = new Array(capacity).fill(0);
    let succStack = new Array(capacity);

    let currentEntry = e;
    let currentSucc = new SuccessorsEnum(currentEntry);
    stack[size] = currentEntry;
    succStack[size] = currentSucc;
    size++;

    while (size > 0) {
        currentEntry = stack[size - 1];
        currentSucc = succStack[size - 1];

        if (currentSucc.hasMoreElements()) {
            let nextChild = currentSucc.nextElement();
            currentSucc = new SuccessorsEnum(nextChild);
            ts[nextChild + 2] = nextChild < 0 ? 0 : dump.heapSize[nextChild];

            if (size == capacity) {
                let newCapacity = capacity << 1;
                let newArr = new Array(newCapacity).fill(0);
                Utils.arraycopy(stack, 0, newArr, 0, capacity);
                stack = newArr;

                let newSuccessorsArr = new Array(newCapacity);
                Utils.arraycopy(succStack, 0, newSuccessorsArr, 0, capacity);
                succStack = newSuccessorsArr;
                capacity = newCapacity;
            }
            stack[size] = nextChild;
            succStack[size] = currentSucc;
            size++;
        }
        else {
            size--;

            if (size > 0)
                ts[stack[size - 1] + 2] += ts[currentEntry + 2];

            if (currentEntry >= 0) {
                retained.set(currentEntry, ts[currentEntry + 2]);
            }

        }
    }

    retained = null;
}

// 没办法，这里必须写成内部类，尽量还是不要这么干
class SuccessorsEnum {
    constructor(parent) {
        this.parent = parent;
        this.nextIndex = this.findFirstChildIndex(parent + 2);
    }

    hasMoreElements() {
        return this.nextIndex > 0;
    }

    nextElement() {
        if (this.nextIndex < 0) {
            throw new Error('NoSuchElementException');
        }
        let res = elements[this.nextIndex++];

        if (this.nextIndex >= dom.length || dom[this.nextIndex] != this.parent + 2) {
            this.nextIndex = -1;
        }

        return res;
    }

    findFirstChildIndex(el) {
        // TODO: 有空实现下 binarySearch
        // let i = Arrays.binarySearch(dom, el);
        let i = dommap[el] || -1;
        while ((i > 1) && (dom[i - 1] == el)) {
            i--;
        }
        return i;
    }
}

class FlatDominatorTree {
    constructor(dumpparam, domparam, elementparam, root, dommapparam) {
        dump = dumpparam;
        dom = domparam;
        dommap = dommapparam;
        elements = elementparam;
        ts = new Array(domparam.length).fill(0);
        calculateTotalSizesIterative(root);
        this.ts = ts;
    }

    getSuccessorsEnum(i) {
        return new SuccessorsEnum(i);
    }

    getSuccessorsArr(parentId) {
        parentId += 2;

        // TODO: 有空实现下 binarySearch
        // int j = Arrays.binarySearch(dom, parentId);
        let j = dommap[parentId] || -1;
        if (j < 0)
            return [];

        let i = j;
        while ((i > 1) && (dom[i - 1] == parentId)) {
            i--;
        }

        while (j < dom.length && dom[j] == parentId)
            j++;

        let length = j - i;
        let result = new Array(length).fill(0);
        Utils.arraycopy(elements, i, result, 0, length);

        return result;
    }

    sortByTotalSize(objectIds) {
        let length = objectIds.length;
        // v8 对长度和大小都不可能超过 int 的范围，这里可以放心使用
        let totalSizes = new Array(length).fill(0);
        for (let i = 0; i < length; i++) {
            totalSizes[i] = ts[objectIds[i] + 2];
        }

        // 呵呵，如果 totalSizes.length 超过 TEMP_ARR_LENGTH，直接 over
        if (totalSizes.length > 1) {
            ArrayUtils.sortDesc(totalSizes, objectIds);
        }
    }
}

module.exports = FlatDominatorTree;