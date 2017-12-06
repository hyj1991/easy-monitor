'use strict';

class BitField {
    /**
     * @param {number} size 
     * @description 构造函数
     */
    constructor(size) {
        if (size === 0) size = 1;
        this.bits = new Array((((size) - 1) >>> 0x5) + 1).fill(0);
    }

    set(index) {
        this.bits[index >>> 0x5] |= (1 << (index & 0x1f));
    }

    clear(index) {
        this.bits[index >>> 0x5] &= ~(1 << (index & 0x1f));
    }

    get(index) {
        return (this.bits[index >>> 0x5] & (1 << (index & 0x1f))) != 0;
    }
}

module.exports = BitField;