# Easy-Monitor 2.0

[![npm version](https://badge.fury.io/js/easy-monitor.svg)](https://badge.fury.io/js/easy-monitor)
[![Package Quality](http://npm.packagequality.com/shield/easy-monitor.svg)](http://packagequality.com/#?package=easy-monitor)
[![npm](https://img.shields.io/npm/dt/easy-monitor.svg)](https://www.npmjs.com/package/easy-monitor)
[![license](https://img.shields.io/github/license/mashape/apistatus.svg)](LICENSE)

## I. 简介

轻量级的 Node.js 项目内核性能监控 + 分析工具，在默认模式下，只需要在项目入口文件 ```require``` 一次，无需改动任何业务代码即可开启内核级别的性能监控分析。

### - 功能特点

* 服务器状态概览信息展示
* 实时 CPU 函数性能分析，帮助定位程序的性能瓶颈点
* 实时 Memory 堆内内存结构分析，帮助定位到内存疑似泄漏点

Easy-Monitor 旨在帮助大家更深入的理解自己的 Node 项目进程，以便性能优化时能更有针对性，最终提升大家的项目体验。

### - 兼容性

目前经过测试，兼容以下 Node.js 版本：

* Node v4.x
* Node v6.x
* Node v8.x
* Node v10.x

因为 Node.js 的 LTS 版本都是偶数版本，所以此处并未对于奇数版本进行测试（v5.x，v7.x），如果有测试过的可以以 [issue](https://github.com/hyj1991/easy-monitor/issues) 的形式将兼容性结果反馈。

注：Node v8.x 截止目前为止 (2017.6.6) 下使用 v8-profiler 有 ```Segmentation fault (core dumped)``` 的核心错误，并且官方 issue 修复较慢 ( [issue 112](https://github.com/node-inspector/v8-profiler/issues/112) ), 故经排查源代码后发布了 [v8-profiler-node8](https://www.npmjs.com/package/v8-profiler-node8) 临时解决了这个 bug，等官方修复后，会将 Easy-Monitor 的依赖切回 [v8-profiler](https://www.npmjs.com/package/v8-profiler) 。

### - 2.0 新特性

* 基于 vue.js 和 iview 组件全新设计的 **UI**
* 全面兼容 **v4.x ~ v8.x**
* 新增概览 **Overview** 展示页
* 支持 **动态更新配置**，无需重启一键生效
* 支持 **Stream** 流式解析更大的 HeapSnapshot
* 支持 **Cluster** 集群部署，支持定制 **私有协议**

## II. 快速开始

### - 安装模块

执行如下命令安装 Easy-Monitor：

```js
npm install easy-monitor
```

### - 项目中引入

在你的项目入口文件中按照如下方式引入，当然请传入你的项目名称：

```js
const easyMonitor = require('easy-monitor');
easyMonitor('你的项目名称');
```

好了，此时你所需要做的一切都已就绪，接下来以你喜欢的方式运行项目即可，不管是 ```nohup``` 还是 ```pm2```，亦或是直接 ```node``` 启动均可。

### - 访问监控页面

打开你的浏览器，访问 http://localhost:12333 ，即可看到进程界面。

### - 完整样例 & Demo

为了帮助大家更好的理解使用，下面编写一个 Easy-Monitor 嵌入 Express 应用的完整例子

```js
'use strict';
const easyMonitor = require('easy-monitor');
easyMonitor('Mercury');
const express = require('express');
const app = express();

app.get('/hello', function (req, res, next) {
    res.send('hello');
});

app.listen(8082);
```


将上述的内容保存成一个 js 文件，启动后访问 http://127.0.0.1:12333 即进入 Easy-Monitor 的首页，就是这样的简单！

这里有一个在线真实的 Demo 地址：[Easy-Monitor Demo](http://47.100.164.242/index)，可以点击进入自行尝试一番。

## III. 深度定制化 & 通用配置 &动态更新配置

深度定制化开发、通用配置项以及如何动态更新配置项详见 [Easy-Monitor 详细文档](http://47.100.164.242/document)

图文指南，参见 [Easy-Monitor 2.0: 开启你的 Node.js 内核性能监控](https://cnodejs.org/topic/594f6e21642874f845d9fe0d#599beae0bae6f2ed6f7e4c45)

## IV. 更新日志

**v2.1.0:**

* 增加了动态更新配置的功能，[Easy-Monitor 详细文档](http://47.100.164.242/document) 中同步添加动态更新配置的功能说明

**v2.1.1:**

* 修正一处在开启第三方缓存模式下动态修改鉴权信息的 bug
* 优化了文档说明
* 优化了 CPU Profiling 结果解析算法，提升速度

**v2.1.2:**

* 修正了默认部署模式下开启 inspect 或 debug 调试时无法启动的问题
* 修正了新的 CPU Profiling 算法下的计算调用者百分比的错误，页面增加了调用者函数名称的展示
* 增加了通知子进程进行操作时的超时判定
* 增加了配置长时间采集 CPU 数据时的中间态友好提示：总耗费 xxx 时长，剩余时间 xxx 时长
* 增加了采集 CPU/Memory 数据分析支持开启子进程分析，减小对业务进程计算压力（可动态更改）

**v2.1.3:**

* 修正了开启子进程处理数据在 Node v6.4.0 及以下版本不支持的问题
* 修正了开启计算的子进程内存溢出后导致主进程 WRITE EPIPE 的错误
* 优化了 MEM 分析部分搜索任意节点的功能，如下：
  * 搜索任意节点一栏移至最上方
  * 展示由引力图更改为详细的树结构展示
  * 搜索逻辑更改为支持从 root 节点出发的限定深度内的所有节点
* 优化了负责数据解析的子进程启动参数，以能够处理更大的 HeapSnapshot
* 优化了 CPU & Memory 分析期间的中间态错误提示

**v2.1.5:**

* 增加了虚拟路径转发的功能，[Easy-Monitor 详细文档](http://47.100.164.242/document/#/?id=-%E8%99%9A%E6%8B%9F%E8%B7%AF%E5%BE%84%E8%BD%AC%E5%8F%91) 中同步添加虚拟路径转发的功能说明

**v2.1.6:**

* 增加了针对核心的 common & config 模块的单元测试
* 修正了内存 dump 的结束未删除的 bug
* 修正了 node 版本为 6.4.0 时，fork 子进程 stdio 入参错误的问题

**v2.1.7:**

* 增加了在线 CPU Profiling 展示 CPU 数据采集期间函数执行总时长
* 增加了在线 CPU Profiling 展示对函数执行总时长和平均时长的升降序排序

**v2.1.9:**

* 修正了 [issue#35](https://github.com/hyj1991/easy-monitor/issues/35) 提供的 bug
* 增加了 CPU Profiling 日志解析后的 Flamegraph 展示
* 优化了解析算法
* 去除了 CPU Profiling 展示函数执行超过阈值的列表（意义不是很大，替换为火焰图展示）

**v2.2.0:**

* 优化了 Dominator Tree 计算过程
* 优化了疑似内存泄漏链条的引力图，使用 D3.js

**v2.2.1:**

* 修正了 [issue#49](https://github.com/hyj1991/easy-monitor/issues/49) 提供的 bug
* 优化了默认 CPU Profiling 的时长至 5min
* 优化了去重疑似内存泄漏 key 列表

**v2.2.2:**

* 解决了 v8-profiler-node8 这个模块在 v10.x 下编译不过的问题，更新了对应的依赖，以支持部分开发者 v10.x 尝鲜

**v2.2.3:**

* 修正了 [issue#73](https://github.com/hyj1991/easy-monitor/issues/73) 提供的 bug
  * 会导致某些场景下的 cpu profile 序列化时出错

**v2.2.4:**

* 修正了 [issue#81](https://github.com/hyj1991/easy-monitor/issues/81) 提供的 bug
  * Node 10 下编译 v8-profiler-node8 失败

**v2.2.5:**

* 修正了 [issue#85](https://github.com/hyj1991/easy-monitor/issues/85) 提供的 bug
  * 开启了 auth 但是未启用 admin 账号下，保存一次配置信息后会出现没有权限操作的提示

**v2.2.6:**

* 修正了 [issue#89](https://github.com/hyj1991/easy-monitor/issues/89) 提供的 bug
  * 配置虚拟路径转发后，d3.js 没有正确重定向

**v2.2.7:**

* 更新了 easy-monitor 的 demo & document 服务至阿里云主机

## V. 单元 & 覆盖率测试

git clone 下本项目并且安装完毕 dependence 依赖后，执行如下命令进行单元测试:

```bash
npm run test
```

也可以执行如下命令查看单元测试覆盖率:

```bash
npm run cov
```

如果执行了覆盖率测试，使用浏览器打开 **coverage/lcov-report/index.html** 文件，则可以看到详细的覆盖率信息。

## VI. License

[MIT License](LICENSE)

Copyright (c) 2017 hyj1991
