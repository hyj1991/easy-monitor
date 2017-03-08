/**
 * Created by huangyijun on 16/11/11.
 */
'use strict';
//全局注入一些公共方法
global.di = {
    //日志句柄
    //TODO,简单实现,后期更换为专业的buyan
    logger: {
        info: console.info.bind(`[${new Date()}]:`),
        debug: console.log.bind(`[${new Date()}]:`),
        warn: console.warn.bind(`[${new Date()}]:`),
        error: console.error.bind(`[${new Date()}]:`)
    }
};

const Agent = require('./agent/Agent.js');

//TODO,配置文件暂时写死测试,后期会提供loadConfig方法
new Agent({
    server: {
        host: '127.0.0.1',
        port: '4009'
    },
    /*redis: {
     host: '172.22.0.27',
     port: '6379',
     blokcPrefix: 'ACHILLES::LIST'
     },*/
    loopTime: 10 * 1000,
    metricPath: '/metricDataPost/000001',
    appId: 'achilles',
    appName: 'achilles',
    env: process.env.NODE_ENV || 'local'
}).startAgent();