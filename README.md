<div align="center">
  <img width="300" heigth="300" src="https://github.com/hyj1991/assets/blob/master/easy-monitor/logo.png" alt="easy-monitor logo">
</div>

[![npm version](https://badge.fury.io/js/easy-monitor.svg)](https://badge.fury.io/js/easy-monitor)
[![Package Quality](http://npm.packagequality.com/shield/easy-monitor.svg)](http://packagequality.com/#?package=easy-monitor)
[![npm](https://img.shields.io/npm/dt/easy-monitor.svg)](https://www.npmjs.com/package/easy-monitor)
[![license](https://img.shields.io/github/license/mashape/apistatus.svg)](LICENSE)

# Easy-Monitor
[English Version](README_EN.md)

## 简介

轻量级的Node进程状态监控工具，仅仅需要项目入口 ```require``` 一次，就可以非常便捷地展示出进程的状态细节。

### 功能

* **找出执行时长耗费最久的5个或者更多的函数**
* **找出那些执行时间超出预期的5函数**
* **找出v8引擎无法优化的函数**

以上展示的列表数量均可在url中直接配置，另外展示列表内容可以在项目中对 **函数名** 以及 **函数所在的文件路径** 进行过滤，来保证展示出的就是开发者所需要的信息。

这个工具的目的是帮助大家更深入的理解自己的Node进程，性能优化时能更有针对性，最终提升大家的项目体验。

### 特点

* **轻量级**：```Easy-Monitor``` 非传统C/S物理分离模式，```require``` 后即可使用，没有额外的监控server/agent部署成本
* **运行时**：```Easy-Monitor``` 针对的是运行时的函数性能以及内存细节进行处理展示，可用于线上生产环境项目。
* **无状态**：```Easy-Monitor``` 永远展示的是开发者访问时的业务进程状态。

## 兼容性
* Node v6.x
* Node v5.x
* Node v4.x

暂不支持Node v7.x版本

## 快速开始

### 安装

在控制台执行下面的命令安装：

```bash
npm install easy-monitor
```

### 项目中引入

在你的项目入口文件中按照如下方式引入，传入你的项目名称：

```js
const easyMonitor = require('easy-monitor');
easyMonitor('你的项目名称');
```

### 访问监控页面

打开你的浏览器，输入以下地址，即可看到进程相关信息：

```bash
http://127.0.0.1:12333
```
### 下面是一个嵌入Express应用的完整例子

```
'use strict';
require('easy-monitor')('your project name');
const express = require('express');
const app = express();

app.get('hello', function (req, res, next) {
    res.send('hello');
});

app.listen(8082);
```

将上述的内容保存成一个js文件，启动后访问 ```http://127.0.0.1:12333```即进入Easy-Monitor的首页。

## 监控页面一览

### 首页

#### 查看整个项目

<img width="400" heigth="200" src="https://github.com/hyj1991/assets/blob/master/easy-monitor/Index_Project.jpeg" alt="Index_Project">

如图，点击项目名称，则会对整个项目所有的进程进行profiling操作，这个所有进程包含：

* 单进程模式下则只有一个主进程
* cluster模式下所有的子进程

#### 查看项目下某一个子进程

<img width="500" heigth="250" src="https://github.com/hyj1991/assets/blob/master/easy-monitor/Index_Pid.jpeg" alt="Index_Pid">

如图，在cluster模式下项目会有多个子进程，点击某一个特定的pid，则只会对此cluster子进程进行profiling操作。

#### 多项目部署

![Index_Multi](https://github.com/hyj1991/assets/blob/master/easy-monitor/Index_Multi.jpeg)

如图，```Easy-Monitor``` 支持多项目部署，用法和单项目时一模一样的，可以参考前面的快速开始。那么多项目启动后，监控页面会展示出不同的项目名称和对应的子进程pid。

### 监控详情页

#### 执行时间超出预期的函数列表

![Detail_Long](https://github.com/hyj1991/assets/blob/master/easy-monitor/Detail_Long.jpeg)

如图，可以追加 ```querystring``` 参数的形式自定义预期时间以及展示的条数，如下：

* ```?timeout=你预期的时间(ms)```
* ```?long_limit=你想展示的条数```
* ```?timeout=你预期的时间(ms)&long_limit=你想展示的条数```

#### 耗费时间最久的函数列表

![Detail_Top](https://github.com/hyj1991/assets/blob/master/easy-monitor/Detail_Top.jpeg)

如图，可以追加 ```querystring``` 参数的形式自定义展示条数，如下：

* ```?top_limit=你想展示的条数```

#### v8引擎无法优化的函数列表

![Detail_Bail](https://github.com/hyj1991/assets/blob/master/easy-monitor/Detail_Bail.jpeg)

如图，可以追加 ```querystring``` 参数的形式自定义展示条数，如下：

* ```?bail_limit=你想展示的条数```

# License

[MIT License](LICENSE)

Copyright (c) 2017 hyj1991