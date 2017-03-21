# Easy-Monitor
[English Version](README.md)

##简介

轻量级的Node进程状态监控工具，仅仅需要项目入口 ```require``` 一次，就可以非常便捷地展示出进程的状态细节。

### 功能

* **执行时长超过预期的函数列表**
* **执行时间最长的5个函数列表**
* **profiling期间引擎逆优化函数列表**

以上展示的列表数量均可在url中直接配置，另外展示列表内容可以在项目中对 **函数名** 以及 **函数所在的文件路径** 进行过滤，来保证展示出的就是开发者所需要的信息。

### 特点

* **轻量级**：```Easy-Monitor``` 非传统C/S物理分离模式，```require``` 后即可使用，没有额外的监控server/agent部署成本
* **运行时**：```Easy-Monitor``` 针对的是运行时的函数性能以及内存细节进行处理展示，可用于线上生产环境项目。
* **无状态**：```Easy-Monitor``` 永远展示的是开发者访问时的业务进程状态。

##兼容性
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

# License

[MIT License](LICENSE)

Copyright (c) 2017 hyj1991