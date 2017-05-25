'use strict';
const path = require('path');
const rootPath = path.join(__dirname, './src_logic');
const common = require(path.join(rootPath, 'common/_'))({ pre: ['config', 'logger'] });
const _require = common.require;
const dashboard = _require('dashboard');
const embrace = _require('embrace');

module.exports = function (options) {
    const config = common.config;

    //合并用户参数
    options = options || process.title;
    common.utils.merge(options);

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
    //common.utils.forkNode('/dasd');
}