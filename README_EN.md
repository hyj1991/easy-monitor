<div align="center">
  <img width="300" heigth="300" src="https://github.com/hyj1991/assets/blob/master/easy-monitor/logo.png" alt="easy-monitor logo">
</div>

[![npm version](https://badge.fury.io/js/easy-monitor.svg)](https://badge.fury.io/js/easy-monitor)
[![Package Quality](http://npm.packagequality.com/shield/easy-monitor.svg)](http://packagequality.com/#?package=easy-monitor)
[![npm](https://img.shields.io/npm/dt/easy-monitor.svg)](https://www.npmjs.com/package/easy-monitor)
[![license](https://img.shields.io/github/license/mashape/apistatus.svg)](LICENSE)

# Easy-Monitor
[中文版](README.md)

## Introduction

A lightweight Node.js performance monitoring tool, you just need to ```require``` it at the entrance of your project, then ```Easy-Monitor``` will show you your Node.js process details.

### I.Functions

* **Find 5 or more functions that take the longest execution time**
* **Find functions that perform more than expected**
* **Find the functions which V8 engine can not optimize**

The number of listings disaplayed above can be configured directly in URL.
You can also set your own rule that you can fiter **functions** and **filePaths** so that the results is what you really want.

The purpose of ```Easy-Monitor``` is to help you more in-depth understanding of our Node process, performance optimization can be more targeted, and ultimately enhance our project experience.


### II.Feature

* **LightWeight**：```Easy-Monitor``` is unconventional C/S physical separation model，all you need to to is ```require``` in your project，there is no additional server/agent deployment costs.

* **RunTime**：```Easy-Monitor``` can provide you runtime performance and memory details, and it can be used for production.

* **Stateless**：```Easy-Monitor``` always show you your node process status when you visit it.

## Compatibility
* Node v6.x
* Node v5.x
* Node v4.x

Temporary don't support Node v7.x.

## Quick Start

```Easy-Monitor``` is simple，only three steps you can start your own performance monitor.

### I.Install

Simply run as：

```bash
npm install easy-monitor
```

### II.Require

Require in your project，argument is your project name, such as:

```js
const easyMonitor = require('easy-monitor');
easyMonitor('your project name');
```

### III.Visit

Open browser, input as below, then you will see detail:

```bash
http://127.0.0.1:12333
```

### IV.A thorough example with Express

```js
'use strict';
const easyMonitor = require('easy-monitor');
easyMonitor('your project name');
const express = require('express');
const app = express();

app.get('/hello', function (req, res, next) {
    res.send('hello');
});

app.listen(8082);
```

Save the above as a JS file, then open your browser and visit ```http://127.0.0.1:12333```, it is so simply!

## 高级定制化

### I.定制化参数

```Easy-Monitor``` 也为大家保留了一些重要的属性可以方便定制化，依靠执行 ```require('easy-monitor')(object)``` 函数时传入一个对象，来替代默认传入的项目名称的字符串，这个传入的对象可以包含如下属性：

* **logLevel**：Number类型，默认是2，用来设置日志级别：
	* 0：不输出任何日志
	* 1：输出error日志
	* 2：输出info日志
	* 3：输出debug日志

* **appName**：String类型，默认是 process.title 获取到的值，用来设置项目名称

* **httpServerPort**：Numver类型，默认是 12333，用来设置监控HTTP服务器的侦听端口

* **filterFunction**：函数，默认将profiling的结果中过滤掉了包含node_modules、anonymous以及路径中不包含 "/" 的系统函数，开发者可以自己编写过滤函数来找出自己想要的结果，入参和返回值：
	* filePath：String类型，profiling结果函数所在的文件全路径
	* funcName：String类型，pfofiling结果函数的名称
	* 返回值：为true表示保留结果，false表示过滤掉

* **monitorAuth**：函数，默认不鉴权，用来进行登入监控页面的鉴权，开发者可以自己编写鉴权函数，入参和返回值：
	* user：String类型，为用户名
	* pass：String类型，为用户键入密码
	* 返回值：Promise对象实例，resolve(true)表示鉴权通过，resolve(false)或者reject表示鉴权失败

### II.定制化例子

下面是一个使用 ```Easy-Monitor``` 嵌入Express项目的定制化的完整例子：

```js
'use strict';
const easyConfig = {
    logLevel: 3,
    appName: 'My Project 1',
    httpServerPort: 8888,
    filterFunction: function (filePath, funcName) {
        if (funcName === 'anonymous' || ~filePath.indexOf('node_modules')) {
            return false;
        }
        return Boolean(/^\(\/.*/.test(filePath));
    },
    monitorAuth: function (user, pass) {
        return new Promise(resolve => resolve(Boolean(user === 'admin' && pass === 'lifeishard')));
    }
};
const easyMonitor = require('easy-monitor');
easyMonitor(easyConfig);

const express = require('express');
const app = express();

app.get('/hello', function helloIndex(req, res, next) {
    let date = Date.now();
    while (Date.now() - date < 300) {
    }
    res.send('hello');
});

app.listen(8082);
```

这个例子中，日志级别被调整为3，监控服务器端口更改为8888，也设置了过滤规则和简单的鉴权规则。
并且 ```/hello``` 这个路由被设置成阻塞300ms后返回，大家可以打开 ```http://127.0.0.1:8888``` 进入 ```Easy-Monitor``` 首页，点击项目名称或者pid进行profiling操作，同时不停访问 ```http://127.0.0.1:8082/hello``` 这个路径，然后观察结果来自行尝试一番。


## 监控页面一览

### I.首页

#### 1.查看整个项目

<img width="550" heigth="300" src="https://github.com/hyj1991/assets/blob/master/easy-monitor/Index_Project.jpeg" alt="Index_Project">

如图，点击项目名称，则会对 **整个项目** 所有的进程进行profiling操作，这个所有进程包含：

* 单进程模式下则只有一个主进程
* cluster模式下所有的子进程

#### 2.查看项目下某一个子进程

<img width="550" heigth="300" src="https://github.com/hyj1991/assets/blob/master/easy-monitor/Index_Pid.jpeg" alt="Index_Pid">

如图，在cluster模式下项目会有多个子进程，点击某一个特定的pid，则只会对 **此pid对应的子进程** 进行profiling操作。

#### 3.多项目部署

<img width="550" heigth="300" src="https://github.com/hyj1991/assets/blob/master/easy-monitor/Index_Multi.jpeg" alt="Index_Multi">

如图，```Easy-Monitor``` **支持多项目部署**，用法和单项目是一模一样的，可以参考前面的快速开始。那么多项目启动后，监控页面会展示出不同的项目名称和对应的子进程pid。

### II.监控详情页

#### 1.执行时间超出预期的函数列表

<img width="550" heigth="300" src="https://github.com/hyj1991/assets/blob/master/easy-monitor/Detail_Long.jpeg" alt="Detail_Long">

如图，可以追加 ```querystring``` 参数的形式自定义预期时间以及展示的条数，如下：

* ```?timeout=你预期的时间(ms)```
* ```?long_limit=你想展示的条数```
* ```?timeout=你预期的时间(ms)&long_limit=你想展示的条数```

#### 2.耗费时间最久的函数列表

<img width="550" heigth="300" src="https://github.com/hyj1991/assets/blob/master/easy-monitor/Detail_Top.jpeg" alt="Detail_Top">

如图，可以追加 ```querystring``` 参数的形式自定义展示条数，如下：

* ```?top_limit=你想展示的条数```

#### 3.v8引擎无法优化的函数列表

<img width="550" heigth="300" src="https://github.com/hyj1991/assets/blob/master/easy-monitor/Detail_Bail.jpeg" alt="Detail_Bail">

如图，可以追加 ```querystring``` 参数的形式自定义展示条数，如下：

* ```?bail_limit=你想展示的条数```

## 测试

clone下本代码后，使用npm安装依赖，然后执行如下测试脚本：

```
npm run test
```

即可看到覆盖率测试报告。

# License

[MIT License](LICENSE)

Copyright (c) 2017 hyj1991