# Architecture

## I. Project address

Easy-Monitor 3.0 version description and entry address: [https://github.com/hyj1991/easy-monitor](https://github.com/hyj1991/easy-monitor) .

Because of the huge changes in the overall structure, multiple sub-modules are divided and stored in the organization \*\*X-Profiler \*\*, the address is: [https://github.com/X-Profiler](https://github.com/X-Profiler) .

A brief description of the functions of each sub-module of the project and the warehouse address:

-   Version 3.0 display console: [xprofiler-console](https://github.com/X-Profiler/xprofiler-console)
-   xtransit management service: [xtransit-manager](https://github.com/X-Profiler/xtransit-manager)
-   xtransit long connection service: [xtransit-server](https://github.com/X-Profiler/xtransit-server)
-   Performance log generation plugin: [xprofiler](https://github.com/X-Profiler/xprofiler)
-   Performance log collector: [xtransit](https://github.com/X-Profiler/xtransit)

## II. Technology Stack

The front end of the console is written based on the [Vue.js](https://vuejs.org/) + [iView UI](https://github.com/view-design/ViewUI) framework, the monitoring server part is written based on the [Egg.js](https://eggjs.org/) framework, and the UI part is based on the [AliNode](https://node.console.aliyun.com/) console as a whole.

Click the [Easy-Monitor 3.0 console sample](http://120.27.24.200:7443/) to preview the function and interface.

## III. Architecture design diagram

Easy-Monitor 3.0 supports three platforms: **Window** , **Linux** and **MacOS** . The overall architecture is as follows: ![image.png](https://cdn.nlark.com/yuque/0/2020/png/155185/1590935827983-bea9fd78-7f10-47dd-9304-8c63ef63656a.png#align=left&display=inline&height=490&margin=%5Bobject%20Object%5D&name=image.png&originHeight=928&originWidth=1666&size=141099&status=done&style=none&width=880)