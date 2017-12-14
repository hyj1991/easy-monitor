'use strict';

class Utils {
    static arraycopy(src, index1, dest, index2, length) {
        // 兼容 node 8 以下
        // dest.splice(index2, length, ...src.slice(index1, index1 + length));
        // dest.splice.apply(dest, [index2, length].concat(src.slice(index1, index1 + length)));

        for (let i = index2; i < index2 + length; i++) {
            dest[i] = src[index1 + i - index2];
        }
        return dest;
    }
}

module.exports = Utils;