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

Easy-Monitor 旨在帮助大家更深入的理解自己的Node进程，性能优化时能更有针对性，最终提升大家的项目体验。

### - 兼容性

目前经过测试，兼容以下 Node.js 版本：

* Node v4.x
* Node v6.x
* Node v8.x

因为 Node.js 的 LTS 版本都是偶数版本，所以此处并未对于奇数版本进行测试（v5.x，v7.x），如果有测试过的可以以 [issue](https://github.com/hyj1991/easy-monitor/issues) 的形式将兼容性结果反馈。

注：Node v8.x 截止目前为止 (2017.6.6) 下使用 v8-profiler 有 ```Segmentation fault (core dumped)``` 的核心错误，并且官方 issue 修复较慢 ( [issue 112](https://github.com/node-inspector/v8-profiler/issues/112) ), 故经排查源代码后发布了 [v8-profiler-node8](https://www.npmjs.com/package/v8-profiler-node8) 临时解决了这个 bug，等官方修复后，会将 Easy-Monitor 的依赖切回 [v8-profiler](https://www.npmjs.com/package/v8-profiler) 。

### - 2.0 新特性

* 全新设计的 **UI**
* 新增概览 **Overview** 展示页
* 全面兼容 **v4.x ~ v8.x**
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

### - 完整嵌入样例

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