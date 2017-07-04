'use strict';
const co = require('co');
const path = require('path');
const rootPath = path.join(__dirname, './src_logic');
const _common = require(path.join(rootPath, 'common/common'));

module.exports = co.wrap(function* (options) {
    //合并用户参数
    options = options || process.title;

    //获取基础配置, pre 表示预先加载的文件，params 表示对应的参数
    const common = _common({ pre: ['config', 'logger', 'utils', 'cache'], param: { config: options } });
    //对 common 文件中需要进行初始化操作的文件进行对应的操作
    yield common.utils.commonInitP(common);

    //获取公共方法
    const _require = common.require;
    const config = common.config;

    //获取 dashboard & embrace
    const dashboard = _require('dashboard');
    const embrace = _require('embrace');

    //如果是 cluster 模式，则单独启动 bootstrap 配置项即可
    if (config.cluster) {
        //启动 dashboard
        config.bootstrap === 'dashboard' && dashboard.start(config, common);
        //启动 embrace
        config.bootstrap === 'embrace' && embrace.start(config, common);
        return;
    }

    //非 cluster 模式下，embrace 嵌入业务进程，dashboard 以 fork 形式启动
    embrace.start(config, common);
    common.utils.forkNode(path.join(rootPath, 'dashboard/_fork.js'), [JSON.stringify(options)]);
});