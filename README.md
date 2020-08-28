# Easy-Monitor 3.0

[![Npm](https://img.shields.io/npm/v/xprofiler)](https://www.npmjs.com/package/xprofiler)
[![Codecov branch](https://img.shields.io/codecov/c/github/X-Profiler/xprofiler/master)](https://codecov.io/gh/X-Profiler/xprofiler/branch/master)
[![Linux/osx build status](https://travis-ci.org/X-Profiler/xprofiler.svg?branch=master)](https://travis-ci.org/github/X-Profiler/xprofiler)
[![Windows build status](https://ci.appveyor.com/api/projects/status/e5xtotum6lbi3mt7/branch/master?svg=true)](https://ci.appveyor.com/project/hyj1991/xprofiler/branch/master)
[![Npm](https://img.shields.io/npm/dm/xprofiler)](https://www.npmjs.com/package/xprofiler)
[![License](https://img.shields.io/github/license/X-Profiler/xprofiler)](LICENSE)

点击 [Easy-Monitor 2.0 分支](https://github.com/hyj1991/easy-monitor/tree/v2.x) 可以访问旧的 2.x 分支查看以前的版本。

点击 [Easy-Monitor 3.0 部署样例](http://www.devtoolx.com/easy-monitor) 对 3.0 版本的控制台部署和应用接入效果以及功能进行预览。

## 3.0 简介

全新的企业级 Node.js 应用性能监控与线上故障定位解决方案。

旨在 Node.js 的开源生态工具链上做一些微小的事情，希望能帮助到想使用和正在使用 Node.js 的开发者更好地感知自己的 Node.js 应用状态，来面对性能和稳定性方面的挑战。

扫钉钉二维码码可以进入本项目的开源官方讨论钉钉群：

 <img width="200" src="https://cdn.nlark.com/yuque/0/2020/jpeg/155185/1594777097276-5a179d17-729d-4781-9cf1-f1600ab4f1c4.jpeg">

### - 新特性

* 针对 Node.js 进程与系统指标的性能监控
* 错误日志展示与依赖 Npm 模块安全风险提示
* 自定义智能运维告警与线上进程实时状态导出

### - 使用指南

Easy-Monitor 3.0 使用文档部署在语雀上，详细内容参见 [Easy-Monitor 3.0 使用指南](https://www.yuque.com/hyj1991/easy-monitor)。

### - 项目地址

因为架构整体变动巨大，Easy-Monitor 3.0 划分了多个子模块存放于组织 X-Profiler 中，地址为：https://github.com/X-Profiler

项目具体拆分的各个子模块功能简述与仓库地址：

* 3.0 版本展示控制台：[xprofiler-console](https://github.com/X-Profiler/xprofiler-console)
* xtransit 管理服务：[xtransit-manager](https://github.com/X-Profiler/xtransit-manager)
* xtransit 长连接服务：[xtransit-server](https://github.com/X-Profiler/xtransit-server)
* 性能日志生成插件：[xprofiler](https://github.com/X-Profiler/xprofiler)
* 性能日志采集器：[xtransit](https://github.com/X-Profiler/xtransit)

### - 设计架构

![architecture](https://cdn.nlark.com/yuque/0/2020/png/155185/1590935827983-bea9fd78-7f10-47dd-9304-8c63ef63656a.png?x-oss-process=image%2Fresize%2Cw_1492)

### - 技术栈

控制台前端基于 [Vue.js](https://vuejs.org) + [iView UI](https://github.com/view-design/ViewUI) 框架编写，监控服务端部分则是基于 [Egg.js](https://eggjs.org/) 框架编写，UI 部分整体参考了 [AliNode](https://node.console.aliyun.com/) 控制台。


## 联系我

如果你在使用 Easy-Monitor 3.0 项目中遇到了问题，欢迎加入钉钉群 **35149528** 一起讨论。

希望本项目能帮助开发者解决更多开发遇到的问题，构建对大家对 Node.js 技术栈的信心，愿天下没有难用的 Node.js！

如果您觉得本项目对您有帮助，请我喝一杯咖啡吧。

<div style="display: flex;justify-content: space-around">
  <img width="300" src="https://cdn.nlark.com/yuque/0/2020/png/155185/1591186145980-72ab76b8-fbfe-441f-95eb-7a34f44f0871.png">
  <img width="300" style="margin-left: 50px;" src="https://cdn.nlark.com/yuque/0/2020/png/155185/1591186152022-e1d5d98b-ebb4-4091-baca-99d225f204a1.png?x-oss-process=image%2Fresize%2Cw_600">
</div>
