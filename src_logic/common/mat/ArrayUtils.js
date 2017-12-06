'use strict';
const USE_SELECTION = 12;
const USE_RADIX = 1000000;

function countsort(srcKeys, destKeys, srcValues, destValues, srcOffset, trgOffset, length, sortByte) {
    let count = new Array(256).fill(0);
    let index = new Array(256).fill(0);

    let shiftBits = 8 * sortByte;
    let srcEnd = srcOffset + length;

    for (let i = srcOffset; i < srcEnd; i++)
        count[((srcKeys[i] >> (shiftBits)) & 0xff)]++;

    if (sortByte == 3) {
        for (let i = 129; i < 256; i++)
            index[i] = index[i - 1] + count[i - 1];
        index[0] = index[255] + count[255];
        for (let i = 1; i < 128; i++)
            index[i] = index[i - 1] + count[i - 1];
    }
    else {
        for (let i = 1; i < 256; i++)
            index[i] = index[i - 1] + count[i - 1];
    }

    for (let i = srcOffset; i < srcEnd; i++) {
        let idx = ((srcKeys[i] >> (shiftBits)) & 0xff);
        destValues[trgOffset + index[idx]] = srcValues[i];
        destKeys[trgOffset + index[idx]++] = srcKeys[i];
    }
}

function countsortDesc(srcKeys, destKeys, srcValues, destValues, srcOffset, trgOffset, length, sortByte) {
    let count = new Array(256).fill(0);
    let index = new Array(256).fill(0);

    let shiftBits = 8 * sortByte;
    let srcEnd = srcOffset + length;

    for (let i = srcOffset; i < srcEnd; i++)
        count[((srcKeys[i] >> (shiftBits)) & 0xff)]++;

    if (sortByte == 7) {
        for (let i = 126; i >= 0; i--)
            index[i] = index[i + 1] + count[i + 1];
        index[255] = index[0] + count[0];
        for (let i = 254; i >= 128; i--)
            index[i] = index[i + 1] + count[i + 1];
    }
    else {
        for (let i = 254; i >= 0; i--)
            index[i] = index[i + 1] + count[i + 1];
    }

    for (let i = srcOffset; i < srcEnd; i++) {
        let idx = ((srcKeys[i] >> (shiftBits)) & 0xff);
        destValues[trgOffset + index[idx]] = srcValues[i];
        destKeys[trgOffset + index[idx]++] = srcKeys[i];
    }
}

function swap(keys, values, a, b) {
    let tmp = keys[a];
    keys[a] = keys[b];
    keys[b] = tmp;

    tmp = values[a];
    values[a] = values[b];
    values[b] = tmp;
}

function radixsort(keys, values, offset, length) {
    let tempKeys = new Array(length).fill(0);
    let tempValues = new Array(length).fill(0);
    countsort(keys, tempKeys, values, tempValues, offset, 0, length, 0);
    countsort(tempKeys, keys, tempValues, values, 0, offset, length, 1);
    countsort(keys, tempKeys, values, tempValues, offset, 0, length, 2);
    countsort(tempKeys, keys, tempValues, values, 0, offset, length, 3);
}

function radixsortDesc(keys, values, tempKeys, tempValues, offset, length) {
    if (tempKeys == null)
        // 原始数据结构类型为 long，但实际上 v8 堆不会超过 MAX_SAFE_VALUE
        tempKeys = new Array(length).fill(0);
    if (tempValues == null)
        tempValues = new Array(length).fill(0);
    countsortDesc(keys, tempKeys, values, tempValues, offset, 0, length, 0);
    countsortDesc(tempKeys, keys, tempValues, values, 0, offset, length, 1);
    countsortDesc(keys, tempKeys, values, tempValues, offset, 0, length, 2);
    countsortDesc(tempKeys, keys, tempValues, values, 0, offset, length, 3);
    countsortDesc(keys, tempKeys, values, tempValues, offset, 0, length, 4);
    countsortDesc(tempKeys, keys, tempValues, values, 0, offset, length, 5);
    countsortDesc(keys, tempKeys, values, tempValues, offset, 0, length, 6);
    countsortDesc(tempKeys, keys, tempValues, values, 0, offset, length, 7);
}

function split(keys, values, left, right) {
    let middle = left + ((right - left) >> 1);
    if (keys[left] > keys[middle])
        swap(keys, values, left, middle);
    if (keys[middle] > keys[right])
        swap(keys, values, middle, right);
    if (keys[left] > keys[middle])
        swap(keys, values, left, middle);
    let splittingIdx = middle;
    let ret = splitIndex(keys, values, left, right, splittingIdx);
    return ret;
}

function splitIndex(keys, values, left, right, splittingIdx) {
    let splittingValue = keys[splittingIdx];
    swap(keys, values, splittingIdx, right);

    let i = left;
    let c = 0;
    for (let j = left; j < right; j++) {
        if (keys[j] < splittingValue) {
            swap(keys, values, i, j);

            if (c > 0)
                swap(keys, values, i + c, j);
            i++;
        }
        else if (keys[j] == splittingValue) {
            swap(keys, values, i + c, j);
            c++;
        }
    }
    swap(keys, values, i + c, right);

    return [i, i + c];
}

function splitDesc(keys, values, left, right) {
    let middle = left + ((right - left) >> 1);
    if (keys[left] < keys[middle])
        swap(keys, values, left, middle);
    if (keys[middle] < keys[right])
        swap(keys, values, middle, right);
    if (keys[left] < keys[middle])
        swap(keys, values, left, middle);
    let splittingIdx = middle;
    return splitDescIndex(keys, values, left, right, splittingIdx);
}

function splitDescIndex(keys, values, left, right, splittingIdx) {
    let splittingValue = keys[splittingIdx];

    swap(keys, values, splittingIdx, right);

    let i = left;
    let c = 0;
    for (let j = left; j < right; j++) {
        if (keys[j] > splittingValue) {
            swap(keys, values, i, j);

            if (c > 0)
                swap(keys, values, i + c, j);
            i++;
        }
        else if (keys[j] == splittingValue) {
            swap(keys, values, i + c, j);
            c++;
        }
    }
    swap(keys, values, i + c, right);

    return [i, i + c];
}

function randomizedIndex(left, right) {
    let ret = left + (((right - left) >> 2) ^ left ^ right) % (right - left);
    return ret;
}

function goodSplit(sizeLeft, sizeRight, sizeAll) {
    let useMedian;
    useMedian = (sizeAll - Math.max(sizeLeft, sizeRight) + 50) > sizeAll / 10;
    return useMedian;
}

function hybridsort(keys, values, left, right) {
    let useMedian = true;
    while (right - left >= 1) {
        if (right - left <= USE_RADIX) {
            if (right - left < USE_SELECTION) {
                for (let i = left; i <= right; i++)
                    for (let j = i; j > left && keys[j - 1] > keys[j]; j--)
                        swap(keys, values, j, j - 1);
                return;
            }
            radixsort(keys, values, left, right - left + 1);
            break;
        }
        else {
            let i = useMedian ? split(keys, values, left, right) : splitIndex(keys, values, left, right, randomizedIndex(left, right));

            let sizeLeft = i[0] - left;
            let sizeRight = right - i[1];

            useMedian = goodSplit(sizeLeft, sizeRight, right - left);

            if (sizeLeft <= sizeRight) {
                hybridsort(keys, values, left, i[0] - 1);
                left = i[1] + 1;
            }
            else {
                hybridsort(keys, values, i[1] + 1, right);
                right = i[0] - 1;
            }
        }
    }
}

function hybridsortDesc(keys, values, tmpKeys, tmpValues, left, right) {
    let useMedian = true;
    while (right - left >= 1) {
        if (right - left <= USE_RADIX) {
            if (right - left < 12) {
                for (let i = left; i <= right; i++)
                    for (let j = i; j > left && keys[j - 1] < keys[j]; j--)
                        swap(keys, values, j, j - 1);
                return;
            }
            radixsortDesc(keys, values, tmpKeys, tmpValues, left, right - left + 1);
            break;
        }
        else {
            let i = useMedian ? splitDesc(keys, values, left, right) : splitDescIndex(keys, values, left, right, randomizedIndex(left, right));

            let sizeLeft = i[0] - left;
            let sizeRight = right - i[1];

            useMedian = goodSplit(sizeLeft, sizeRight, right - left);

            if (sizeLeft <= sizeRight) {
                hybridsortDesc(keys, values, tmpKeys, tmpValues, left, i[0] - 1);
                left = i[1] + 1;
            }
            else {
                hybridsortDesc(keys, values, tmpKeys, tmpValues, i[1] + 1, right);
                right = i[0] - 1;
            }
        }
    }
}

class ArrayUtils {
    static sort(keys, values, offset, length) {
        hybridsort(keys, values, offset, offset + length - 1);
    }

    static sortDesc(keys, values) {
        hybridsortDesc(keys, values, null, null, 0, keys.length - 1);
    }
}

module.exports = ArrayUtils;