# Node.js 应用接入（非 Egg.js）

通用 Node.js 应用接入 Easy-Monitor 3.0 监控体系主要分为两个部分：

- 应用安装并开启 [xprofiler](https://www.npmjs.com/package/xprofiler) 性能日志插件
- 服务器实例或者 docker 容器实例上部署 [xtransit](https://www.npmjs.com/package/xtransit) 日志采集器

## I. 开启性能日志插件
执行如下命令安装性能日志插件：

```bash
npm install xprofiler --save --xprofiler_binary_host_mirror=https://npm.taobao.org/mirrors/xprofiler
```

接着在你的 Node.js 应用入口文件顶部添加如下代码开启性能日志输出：

```javascript
require('xprofiler').start();
```

## II. 部署日志采集器
日志采集器 `xtransit` 负责定时采集并上报 `xprofiler` 插件生成的性能日志、系统日志和错误日志（如果配置了）等。监控服务端依据采集器上报的 `appId` 来识别本次上报数据归属于哪一个应用，因此这里我们首先需要在前一节中部署完毕的控制台中创建新应用。

### 1. 创建应用
访问 `http://127.0.0.1:8443/` 打开前一节中部署完毕的监控控制台，点击右上角的 `创建新应用` 按钮来新建一个应用：

![image.png](https://cdn.nlark.com/yuque/0/2020/png/155185/1591177467079-44ce1c4a-1408-4704-84f1-b5350c0a564c.png#align=left&display=inline&height=230&margin=%5Bobject%20Object%5D&name=image.png&originHeight=460&originWidth=1038&size=43610&status=done&style=shadow&width=519)

输入完成应用名称后，点击 **提交** 即可完成新应用的创建，监控服务端会自动生成 `appId` 和随机秘钥 `appSecret` ，如下图所示：

![image.png](https://cdn.nlark.com/yuque/0/2020/png/155185/1591177585109-f7914c1a-0e26-435a-b2a7-f0eee26cc70f.png#align=left&display=inline&height=249&margin=%5Bobject%20Object%5D&name=image.png&originHeight=498&originWidth=1036&size=46702&status=done&style=shadow&width=518)

### 2. 创建配置
启动日志采集器 `xtransit` 所需要的配置如下所示：

```javascript
// config

module.exports = {
  // I. 必须的配置
  server: `ws://127.0.0.1:9090`, // 填写前一节中部署的 xtransit-server 地址
  appId: 1, // 创建应用得到的应用 ID
  appSecret: '*************', // 创建应用得到的应用 Secret
  
  // II. 比较重要的可选配置
  disks: [], // 数组，配置需要监控的 disk 全路径
  errors: [], // 数组，配置需要监控的 error 日志全路径
  packages:[], // 数组，配置需要监控的项目依赖文件全路径
  
  // III. 不是很重要的可选的配置
  logDir: '/path/to/xprofiler_output', // xprofiler 插件生成性能日志文件的目录，默认两者均为 os.tmpdir()
  docker: false, // 默认 false, 系统数据采集会依赖当前是否是 docker 环境而进行一些特殊处理，可以手动强制指定当前实例是否为 docker 环境
  ipMode: false, // 默认 false，此时仅使用 hostname 作为 agentId；设置为 true 后 agentId 组装形式为 ${ip}_${hostname} 
  libMode: false, // 默认 false，此时采集如果收到 shutdown 事件会退出当前进程；如果是以第三方库的形式引用接入应用内，请将此属性设置为 true
  errexp: /\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/i, // 匹配错误日志起始的正则，默认为匹配到 YYYY-MM-DD HH:mm:ss 时间戳即认为是一条错误日志的其实
  logger: app.logger, // 可以传入应用日志句柄方便日志统一管理，需要实现 error, info, warn 和 debug 四个方法
  logLevel: 2, // 默认内置 logger 的日志级别，0 error，1 info，2 warning，3 debug
};
```

### 3.1 启动采集器（全局模式）
因为实际上一个 ECS 实例（或者 docker 实例）仅需要启动一个采集器即可，因此我们可以采用全局启动的方式来进行部署。首先执行如下命令安装 `xtransit` ：

```bash
npm install xtransit -g
```
然后将编写完成后的配置保存为 `config.js` ，执行如下命令进行全局启动：

```bash
xtransit start ./config.js
```

出现 `xtransit has started(pid: xxx)` 的提示则表示全局部署成功。

### 3.2 启动采集器（嵌入应用）
有些情况下我们没有权限在实例上安装全局的客户端，采集器本身也支持以第三方依赖的形式启动。首先执行如下命令安装 `xtransit` ：

```bash
npm install xtransit --save
```

然后传入上面编写的配置即可：

```javascript
const xtransit = require('xtransit');
xtransit.start(config);
```

需要注意的是，这段代码不能放到业务进程中，因为线上一般会启动多个业务进程，而我们仅需启动一个采集器，因此可以采取如下方式：

- **PM2 用户：**可以在 PM2 启动配置文件中增加一个 `fork` 模式的进程放置上述逻辑


## III. 小结
安装并开启性能日志插件，且启动采集器成功后，我们可以访问控制台刚才创建的应用查看到进程指标数据，一般来说第一次连接上报需要等待约 1 ~ 2min，更多对控制台的使用可以参见 **玩转控制台** 的相关章节。
