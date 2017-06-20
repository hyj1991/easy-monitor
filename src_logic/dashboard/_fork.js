'use strict';
const path = require('path');
const start = require('./index').start;
const rootPath = path.join(__dirname, '../');
const _common = require(path.join(rootPath, 'common/common'));

//获取用户传入的配置，由于跨进程，仅能获取到字符串类的配置
const userConfig = JSON.parse(process.argv[2]);

//加载出最终的 config & common 项
const common = _common({ pre: ['config', 'logger', 'utils', 'cache'], param: { config: userConfig } });
const _require = common.require;
const config = common.config;

//启动 dashboard
const dashboard = _require('dashboard');
dashboard.start(config, common);