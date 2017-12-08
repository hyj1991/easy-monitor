'use strict';
// 测试文件，等待删除替换
const fs = require('fs');
const Dominator = require('./DominatorTree');
const Parser = require('./Parser');

// const { topDominator, retainedSizes } = new Dominator({
//   numberOfObjects: 58865,
//   inboundIndexList: require('./tmp/inbound.js'),
//   outboundIndexList: require('./tmp/outbound.js'),
//   gcRootsArray: require('./tmp/gcroots.js'),
//   heapSize: require('./tmp/heapsize.js')
// }, {}).calculate();
// 56237
// console.log(topDominator[0] + 2, retainedSizes[topDominator[0] + 2], retainedSizes.length);

// const { topDominator, retainedSizes } = new Dominator({
//     numberOfObjects: 0,
//     inboundIndexList: [],
//     outboundIndexList: [],
//     gcRootsArray: [],
//     heapSize: []
// }, {}).calculate();


const JSONStream = require('JSONStream');
const jsonparser = JSONStream.parse();

// ./tmp/2.heapsnapshot
fs.createReadStream('./tmp/3.heapsnapshot').pipe(jsonparser);
jsonparser.on('data', heapData => {
  const parser = new Parser(heapData);
  parser.init();
  const { topDominator, retainedSizes } = new Dominator({
    numberOfObjects: parser.realNodeCount,
    inboundIndexList: parser.inboundIndexList,
    outboundIndexList: parser.outboundIndexList,
    gcRootsArray: parser.gcRoots,
    heapSize: parser.heapSizeList
  }, {}).calculate();
  parser.retainedSizes = retainedSizes;
  const realInfo = parser.getRealNodeInfo(topDominator[0]);
  const leakMap = parser.getLeakMap(topDominator[0]);
  let str = ``;
  leakMap.forEach(leak => {
    const realInfo = parser.getRealNodeInfo(leak);
    if (str === '') {
      str = `可疑泄漏链条:\n@${realInfo.address}(${retainedSizes[leak + 2]})`;
    } else {
      str = `${str} ---> @${realInfo.address}(${retainedSizes[leak + 2]})`
    }
  });
  console.log(str);
});

jsonparser.on('error', function (err) {
  console.log(err);
});