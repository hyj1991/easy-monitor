'use strict';
const Utils = require('./Utils');

class IntStack {
    constructor(capacity) {
        capacity = capacity || 16;
        this.data = new Array(capacity).fill(0);
        this.size = 0;
    }
    pop() {
        return this.data[--this.size];
    }

    push(i) {
        if (this.size == this.data.length) {
            let newArr = new Array(this.data.length << 1).fill(0);
            Utils.arraycopy(this.data, 0, newArr, 0, this.data.length);
            this.data = newArr;
        }
        this.data[this.size++] = i;
    }

    peek() {
        return this.data[this.size - 1];
    }

    getSize() {
        return this.size;
    }

    capacity() {
        return this.data.length;
    }
}

module.exports = IntStack;