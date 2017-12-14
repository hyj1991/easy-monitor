'use strict';
class LongIndexCollector {
    constructor(size) {
        this.dataElements = new Array(size).fill(0);
    }

    set(index, value) {
        this.dataElements[index] = value;
    }

    get(index) {
        return this.dataElements[index];
    }

    writeTo(indexFile) {
        throw new Error('do not need write');
    }
}

module.exports = LongIndexCollector;