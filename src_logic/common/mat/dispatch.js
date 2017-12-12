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
console.time('JSONStream');
fs.createReadStream('./tmp/4.heapsnapshot').pipe(jsonparser);
jsonparser.on('data', heapData => {
  let start = process.memoryUsage().heapUsed / 1024 / 1024;
  console.timeEnd('JSONStream');
  const parser = new Parser(heapData);
  console.log('new Parser 计算耗费: ' + (process.memoryUsage().heapUsed / 1024 / 1024 - start) + 'M')
  console.time('init');
  let initPre = process.memoryUsage().heapUsed / 1024 / 1024;
  parser.init();
  console.log('init 计算耗费: ' + (process.memoryUsage().heapUsed / 1024 / 1024 - initPre) + 'M')
  console.timeEnd('init');

  console.time('dominator');
  let domPre = process.memoryUsage().heapUsed / 1024 / 1024;
  const result = new Dominator({
    numberOfObjects: parser.realNodeCount,
    inboundIndexList: parser.inboundIndexList,
    outboundIndexList: parser.outboundIndexList,
    gcRootsArray: parser.gcRoots,
    heapSize: parser.heapSizeList
  }, {}).calculate();
  const topDominator = result.topDominator;
  const retainedSizes = result.retainedSizes;
  parser.retainedSizes = retainedSizes;
  console.timeEnd('dominator');
  console.log('dom 计算耗费: ' + (process.memoryUsage().heapUsed / 1024 / 1024 - domPre) + 'M')
  console.time('leak map')
  const realInfo = parser.getRealNodeInfo(topDominator[0]);
  const leakMap = parser.getLeakMap(topDominator[0]);
  let str = ``;
  leakMap.forEach(leak => {
    const realInfo = parser.getRealNodeInfo(leak.realId);
    if (str === '') {
      str = `可疑泄漏链条:\n@${realInfo.address}(${retainedSizes[leak.realId + 2]})`;
    } else {
      str = `${str} ---> @${realInfo.address}(${retainedSizes[leak.realId + 2]})`
    }
  });
  console.log(str);
  console.timeEnd('leak map');
  console.log('计算耗费: ' + (process.memoryUsage().heapUsed / 1024 / 1024 - start) + 'M')
});

jsonparser.on('error', function (err) {
  console.log(err);
});