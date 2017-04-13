<div align="center">
  <img width="300" heigth="300" src="https://github.com/hyj1991/assets/blob/master/easy-monitor/logo.png" alt="easy-monitor logo">
</div>

[![npm version](https://badge.fury.io/js/easy-monitor.svg)](https://badge.fury.io/js/easy-monitor)
[![Package Quality](http://npm.packagequality.com/shield/easy-monitor.svg)](http://packagequality.com/#?package=easy-monitor)
[![license](https://img.shields.io/github/license/mashape/apistatus.svg)](LICENSE)

# Easy-Monitor
[中文版](README_ZH.md)

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

* **LightWeight**：```Easy-Monitor``` is unconventional C/S physical separation model, all you need to to is ```require``` in your project, there is no additional server/agent deployment costs.

* **RunTime**：```Easy-Monitor``` can provide you runtime performance and memory details, and it can be used for production.

* **Stateless**：```Easy-Monitor``` always show you your node process status when you visit it.

## Compatibility
* Node v6.x
* Node v5.x
* Node v4.x

Temporary don't support Node v7.x.

## Quick Start

```Easy-Monitor``` is simple, only three steps you can start your own performance monitor.

### I.Install

Simply run as：

```bash
npm install easy-monitor
```

### II.Require

Require in your project, argument is your project name, such as:

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

Save the above as a JS file, then open your browser and visit ```http://127.0.0.1:12333```, just so simple!

## Customization

### I.Customization Parameters

```Easy-Monitor``` also remain some important
attributes so that we can customize conveniently, it's dependence on the object you set  when executing ```require('easy-monitor')(object)```, this object  can have below attributes as:

* **logLevel**：Number, default is 2, it used to set log level：
	* 0：don't output any log
	* 1：output error log
	* 2：output info log
	* 3：output debug log

* **appName**：String, default is getting from process.title, it used to set your project name.

* **httpServerPort**：Numver, default is 12333, it used to set monitor http server port.

* **filterFunction**：function, default filtering out the profiling results of the 'node_modules' and 'anonymous', and all file paths that don't have the string '/', because of these may be system functions.
Developer can write function to filter your own results, below is the params and returned value:
	* filePath: String, file path that functions at
	* funcName: String, function name
	* returned value: if true remain, if false filtering out

* **monitorAuth**：function, default don't authentication, it used for authentication, developer can write function for own authentication, below is the params and returned value:
	* user：String, it's username
	* pass：String, it's password
	* returned value：a Promise instance, resolve(true) mean authentication pass, resolve(false) or reject mean authentication failed.

### II.Customization Example

Below is a thorough example that ```Easy-Monitor``` with Express：

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

In this example, log level setted to be 3, monitor http server port changed to be 8888, we also set our own filtering rule and simply authentication rule.

More, ```/hello``` setted being blocking after 300ms, you can open ```http://127.0.0.1:8888``` to visit ```Easy-Monitor``` home page, to click the project name or pid, then it will do cpu profiling, meanwhile you can visit ```http://127.0.0.1:8082/hello``` ceaselessly.

After all, you'll get result by trying it.

## Monitor Page Preview

### I.HomePage

#### 1.Profiling The Whole Project

<img width="550" heigth="300" src="https://github.com/hyj1991/assets/blob/master/easy-monitor/Index_Project.jpeg" alt="Index_Project">

As the picture, you can click the project name, this will profiling the **whole project's process**, include:
* single process mode: only main process
* cluster mode: all cluster process

#### 2.Profiling The Unique Process

<img width="550" heigth="300" src="https://github.com/hyj1991/assets/blob/master/easy-monitor/Index_Pid.jpeg" alt="Index_Pid">

As the picture, there will be multiple child process in cluster mode, you can click unique pid, this will profiling the **unique process** only. 

#### 3.Multi Project Deployment

<img width="550" heigth="300" src="https://github.com/hyj1991/assets/blob/master/easy-monitor/Index_Multi.jpeg" alt="Index_Multi">

As the picture, ```Easy-Monitor``` **support multi project deployment**, the usage is exactly the same as the single project, you can refer to Quick Start.

When you deploy multi projects, monitor homepage will display these different project and their child process pid.

### II.DetaiPage

#### 1.List of the Time-Executing out of Expected Functions

<img width="550" heigth="300" src="https://github.com/hyj1991/assets/blob/master/easy-monitor/Detail_Long.jpeg" alt="Detail_Long">

As the picture, we can add ```querystring``` params to customize the expected time and the number of items to display, such as:

* ```?timeout=your expected execution time(ms)```

* ```?long_limit=the number of items you want to display```

* ```?timeout=your expected execution time(ms)&long_limit=the number of items you want to display```

#### 2.List of the Most Time-Consuming Functions

<img width="550" heigth="300" src="https://github.com/hyj1991/assets/blob/master/easy-monitor/Detail_Top.jpeg" alt="Detail_Top">


As the picture, we can add ```querystring``` params to customize the number of items to display, such as:

* ```?top_limit=the number of items you want to display```

#### 3.List of the De-Optimizing Functions By V8 Engine

<img width="550" heigth="300" src="https://github.com/hyj1991/assets/blob/master/easy-monitor/Detail_Bail.jpeg" alt="Detail_Bail">

As the picture, we can add ```querystring``` params to customize the number of items to display, such as:

* ```?bail_limit=the number of items you want to display```

## Unit Test

Run unit test as：

```
npm run test
```

It will create a coverage report.

# License

[MIT License](LICENSE)

Copyright (c) 2017 hyj1991