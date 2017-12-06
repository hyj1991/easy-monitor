'use strict';
// 测试文件，等待删除替换
const fs = require('fs');
const Dominator = require('./DominatorTree');

// const { topDominator, retainedSizes } = new Dominator({
//     numberOfObjects: 58865,
//     inboundIndexList: require('./tmp/inbound.js'),
//     outboundIndexList: require('./tmp/outbound.js'),
//     gcRootsArray: require('./tmp/gcroots.js'),
//     heapSize: require('./tmp/heapsize.js')
// }, {}).calculate();
// console.log(retainedSizes[topDominator[0] + 2]);

const { topDominator, retainedSizes } = new Dominator({
    numberOfObjects: 0,
    inboundIndexList: [],
    outboundIndexList: [],
    gcRootsArray: [],
    heapSize: []
}, {}).calculate();