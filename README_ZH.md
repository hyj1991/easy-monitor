<div align="center">
  <img width="300" heigth="300" src="https://github.com/hyj1991/assets/blob/master/easy-monitor/logo.png" alt="easy-monitor logo">
</div>

[![npm version](https://badge.fury.io/js/easy-monitor.svg)](https://badge.fury.io/js/easy-monitor)
[![Package Quality](http://npm.packagequality.com/shield/easy-monitor.svg)](http://packagequality.com/#?package=easy-monitor)
[![license](https://img.shields.io/github/license/mashape/apistatus.svg)](LICENSE)

# Easy-Monitor
[English Version](README.md)

## 简介

轻量级的Node性能监控工具，仅仅需要项目入口 ```require``` 一次，就可以非常便捷地展示出进程的状态细节。

### I.功能

* **找出执行时长耗费最久的5个或者更多的函数**

* **找出那些执行时间超出预期的函数**

* **找出v8引擎无法优化的函数**

以上展示的列表数量均可在url中直接配置，另外展示列表内容可以在项目中对 **函数名** 以及 **函数所在的文件路径** 进行过滤，来保证展示出的就是开发者所需要的信息。

这个工具的目的是帮助大家更深入的理解自己的Node进程，性能优化时能更有针对性，最终提升大家的项目体验。

### II.特点

* **轻量级**：```Easy-Monitor``` 非传统C/S物理分离模式，```require``` 后即可使用，没有额外的监控server/agent部署成本

* **运行时**：```Easy-Monitor``` 针对的是运行时的函数性能以及内存细节进行处理展示，可用于线上生产环境项目。

* **无状态**：```Easy-Monitor``` 永远展示的是开发者访问时的业务进程状态。

## 兼容性
* Node v6.x
* Node v5.x
* Node v4.x

暂不支持Node v7.x版本

## 快速开始

```Easy-Monitor``` 的使用非常简单，三步即可开启你的专属监控。

### I.安装

在控制台执行下面的命令安装：

```bash
npm install easy-monitor
```

### II.项目中引入

在你的项目入口文件中按照如下方式引入，传入你的项目名称：

```js
const easyMonitor = require('easy-monitor');
easyMonitor('你的项目名称');
```

### III.访问监控页面

打开你的浏览器，输入以下地址，即可看到进程相关信息：

```bash
http://127.0.0.1:12333
```

### IV.下面是一个嵌入Express应用的完整例子

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

将上述的内容保存成一个js文件，启动后访问 ```http://127.0.0.1:12333```即进入Easy-Monitor的首页，就是这样的简单！

## 高级定制化

### I.定制化参数

```Easy-Monitor``` 也为大家保留了一些重要的属性可以方便定制化，依靠执行 ```require('easy-monitor')(object)``` 函数时传入一个对象，来替代默认传入的项目名称的字符串，这个传入的对象可以包含如下属性：

* **logLevel**：Number类型，默认是2，用来设置日志级别：
	* 0：不输出任何日志
	* 1：输出error日志
	* 2：输出info日志
	* 3：输出debug日志

* **appName**：String类型，默认是 process.title 获取到的值，用来设置项目名称

* **httpServerPort**：Number类型，默认是 12333，用来设置监控HTTP服务器的侦听端口

* **filterFunction**：函数，默认将profiling的结果中过滤掉了包含node_modules、anonymous以及路径中不包含 "/" 的系统函数，开发者可以自己编写过滤函数来找出自己想要的结果，入参和返回值：
	* filePath：String类型，profiling结果函数所在的文件全路径
	* funcName：String类型，pfofiling结果函数的名称
	* 返回值：为true表示保留结果，false表示过滤掉

* **monitorAuth**：函数，默认不鉴权，用来进行登入监控页面的鉴权，开发者可以自己编写鉴权函数，入参和返回值：
	* user：String类型，为用户名
	* pass：String类型，为用户键入密码
	* 返回值：Promise对象实例，resolve(true)表示鉴权通过，resolve(false)或者reject表示鉴权失败

### II.定制化例子

下面是一个将 ```Easy-Monitor``` 嵌入Express项目中且定制化的完整例子：

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


## 监控页面预览

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

## 单元测试

clone下本代码后，使用npm安装依赖，然后执行如下测试脚本：

```
npm run test
```

即可看到覆盖率测试报告。

# License

[MIT License](LICENSE)

Copyright (c) 2017 hyj1991