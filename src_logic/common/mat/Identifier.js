'use strict';
const Utils = require('./Utils');

class Identifier {
  constructor() {
    this.identifiers = null;
    this.size = 0;
  }

  add(id) {
    if (this.identifiers == null) {
      this.identifiers = new Array(10000).fill(0);
      this.size = 0;
    }

    if (this.size + 1 > this.identifiers.length) {
      let minCapacity = this.size + 1;
      let newCapacity = this.newCapacity(this.identifiers.length, this.minCapacity);
      if (newCapacity < minCapacity) {
        throw new Error('OutOfMemoryError');
      }
      this.identifiers = this.copyOf(this.identifiers, newCapacity);
    }

    this.identifiers[this.size++] = id;
  }

  sort() {
    // Arrays.sort(this.identifiers, 0, this.size);
    // this.identifiers.sort();
  }

  getsize() {
    return this.size;
  }

  get(index) {
    if (index < 0 || index >= this.size)
      throw new Error('IndexOutOfBoundsException');

    return this.identifiers[index];
  }

  reverse(val) {
    let a, c;
    for (a = 0, c = this.size; a < c;) {
      let b = (a + c) >>> 1;
      let probeVal = this.get(b);
      if (val < probeVal) {
        c = b;
      } else if (probeVal < val) {
        a = b + 1;
      } else {
        return b;
      }
    }
    return -1 - a;
  }

  iterator() {
    let vm = this;
    let index = 0;
    return {
      hasNext() {
        return index < vm.size;
      },

      next() {
        return vm.identifiers[index++];
      }
    }
  }

  getNext(index, length) {
    let answer = new Array(length).fill(0);
    for (let ii = 0; ii < length; ii++)
      answer[ii] = this.identifiers[index + ii];
    return answer;
  }

  close() {
  }

  delete() {
    this.identifiers = null;
  }

  unload() {
    throw new new Error('UnsupportedOperationException');
  }

  copyOf(original, newLength) {
    let copy = new Array(newLength).fill(0);
    Utils.arraycopy(original, 0, copy, 0, Math.min(original.length, newLength));
    return copy;
  }

  newCapacity(oldCapacity, minCapacity) {
    let newCapacity = (oldCapacity * 3 >>> 1);
    if (newCapacity < minCapacity) {
      newCapacity = (minCapacity * 3 >>> 1);
      if (newCapacity < minCapacity) {
        newCapacity = Number.MAX_SAFE_INTEGER - 8;
      }
    }
    return newCapacity;
  }
}

module.exports = Identifier;