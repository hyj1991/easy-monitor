# Node.js 应用接入（Egg.js）

Egg.js 用户接入监控服务端比较简单，实际上就是安装并启用 [`egg-xtransit`](https://github.com/X-Profiler/egg-xtransit) 插件即可完成。


## I. 创建应用
访问 `[http://127.0.0.1:8443/](http://127.0.0.1:8443/)` 打开前一节中部署完毕的监控控制台，点击右上角的 `创建新应用` 按钮来新建一个应用：

![image.png](https://cdn.nlark.com/yuque/0/2020/png/155185/1591177467079-44ce1c4a-1408-4704-84f1-b5350c0a564c.png#align=left&display=inline&height=230&margin=%5Bobject%20Object%5D&name=image.png&originHeight=460&originWidth=1038&size=43610&status=done&style=shadow&width=519)

输入完成应用名称后，点击 **提交** 即可完成新应用的创建，监控服务端会自动生成 `appId` 和随机秘钥 `appSecret` ，如下图所示：

![image.png](https://cdn.nlark.com/yuque/0/2020/png/155185/1591177585109-f7914c1a-0e26-435a-b2a7-f0eee26cc70f.png#align=left&display=inline&height=249&margin=%5Bobject%20Object%5D&name=image.png&originHeight=498&originWidth=1036&size=46702&status=done&style=shadow&width=518)


## II. 配置插件
首先执行如下命令安装插件：

```bash
npm install egg-xtransit --save --xprofiler_binary_host_mirror=https://npm.taobao.org/mirrors/xprofiler
```

然后配置 `config/plugin.js` 启用此插件：

```javascript
// {app_root}/config/plugin.js
exports.xtransit = {
  enable: true,
  package: 'egg-xtransit',
};
```

插件 `egg-xtransit` 的配置需要 `appId` 与 `appSecret` 来连接到控制台，按照第一步中创建的应用信息增加配置项：

```javascript
// {app_root}/config/config.default.js
exports.xtransit = {
  server: 'ws://127.0.0.1:9090',
  appId: 6,
  appSecret: 'bbffaca**************d4fe3e7ab6'
};
```

最后按照正常操作启动 Egg.js 项目即可，正常情况下，你可以在控制台主页看到本地连接上来的实例：

![image.png](https://cdn.nlark.com/yuque/0/2020/png/155185/1591789451589-1efc823b-ee68-41a8-a8fc-86e24efc35c3.png#align=left&display=inline&height=472&margin=%5Bobject%20Object%5D&name=image.png&originHeight=1544&originWidth=3270&size=410503&status=done&style=shadow&width=1000)


## III. 小结
这里提供的 Egg.js 插件 `egg-xtransit` 实际上已经包含了输出内核性能日志的 `xprofiler` 以及采集这些日志信息的 `xtransit` 模块。

借助于 Egg.js 提供的多进程模型与插件机制，我们得以很容易地进行应用接入。


