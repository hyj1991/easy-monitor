'use strict';

class Utils {
    static arraycopy(src, index1, dest, index2, length) {
        // 兼容 node 8 以下
        // dest.splice(index2, length, ...src.slice(index1, index1 + length));
        dest.splice.apply(dest, [index2, length].concat(src.slice(index1, index1 + length)));
    }
}

module.exports = Utils;