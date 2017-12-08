'use strict';
const Utils = require('./Utils');

class ObjectMarker {
  static mark(roots, isize, outbound) {
    let bits = new Array(isize).fill(false);
    let count = 0;
    let size = 0;
    let data = new Array(10 * 1024).fill(0);
    let rootsToProcess = 0;

    for (let rootId of roots) {
      if (!bits[rootId]) {
        if (size == data.length) {
          let newArr = new Array(data.length << 1);
          Utils.arraycopy(data, 0, newArr, 0, data.length);
          data = newArr;
        }
        data[size++] = rootId;
        bits[rootId] = true;
        count++;
        rootsToProcess++;
      }
    }

    let current;

    while (size > 0) {
      current = data[--size];

      if (size <= rootsToProcess) {
        rootsToProcess--;
      }

      for (let child of outbound[current]) {
        if (!bits[child]) {
          if (size == data.length) {
            let newArr = new Array(data.length << 1);
            Utils.arraycopy(data, 0, newArr, 0, data.length);
            data = newArr;
          }
          data[size++] = child;
          bits[child] = true;
          count++;
        }
      }
    }
    // bits.forEach((b, index) => {
    //   if (!b) {
    //     console.log(index)
    //   }
    // })
    return { count: count, reachable: bits };
  }
}

module.exports = ObjectMarker;