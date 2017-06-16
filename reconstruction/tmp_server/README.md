# Easy-Monitor 2.0

## I. 简介

轻量级的 Node.js 项目内核性能监控 + 分析工具，在默认模式下，只需要在项目入口文件 ```require``` 一次，无需改动任何业务代码即可开启内核级别的性能监控分析。

## II. 2.0 新特性一览

* 全新设计的 **UI**
* 新增概览 **Overview** 展示页
* 全面兼容 **v4.x ~ v8.x**
* 支持 **Stream** 流式解析更大的 HeapSnapshot
* 支持 **Cluster** 集群部署，支持定制 **私有协议**

## III. 功能

* **服务器状态概览信息展示**
* **实时 CPU 函数性能分析，帮助定位程序的性能瓶颈点**
* **实时 Memory 堆内内存结构分析，帮助定位到内存疑似泄漏点**

Easy-Monitor 的目的是帮助大家更深入的理解自己的Node进程，性能优化时能更有针对性，最终提升大家的项目体验。

## IV. 兼容性

目前经过测试，兼容以下 Node.js 版本：

* Node v4.x
* Node v6.x
* Node v8.x

因为 Node.js 的 LTS 版本都是偶数版本，所以此处并未对于奇数版本进行测试（v5.x，v7.x），如果有测试过的可以以 issue 的形式将兼容性结果反馈。

注：Node v8.x 截止目前为止 (2017.6.6) 下使用 v8-profiler 有 ```Segmentation fault (core dumped)``` 的核心错误，并且官方 issue 修复较慢（https://github.com/node-inspector/v8-profiler/issues/112）, 故经排查源代码后发布了 [v8-profiler-node8](https://www.npmjs.com/package/v8-profiler-node8) 临时解决了这个 bug，等官方修复后，会将 Easy-Monitor 的依赖切回 [v8-profiler](https://www.npmjs.com/package/v8-profiler)

## V. 快速开始