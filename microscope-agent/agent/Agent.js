/**
 * Created by huangyijun on 16/11/11.
 */
'use strict';
const logger = di.logger;
const os = require('os');
const _ = require('lodash');
const path = require('path');
const Commu = require('./Commu.js');
const Metric = require('./Metrics.js');
const Collect = require('./Colle.js');
const Redis = require('@microscope/node-redis');

const CORE_INSTRUMENTATION = {http: 'http.js'};


class Agent {
    constructor(config) {
        this.config = config || {};
    }

    //启动agent客户端
    startAgent() {
        //TODO, 暂时没有测试服务器,所以本地服务不进行监控
        if (this.config.env !== 'product') return;
        this.instrumentation();
        this.commu = new Commu(this.config);
        this.metric = new Metric(this.config, Date.now());
        if (this.config.redis) {
            this.redis = new Redis(this.config.redis.host, this.config.redis.port);
        }
        this.Colle = Collect;
        this._runLifeCycle();
        //TODO,暂时屏蔽,等待更好的设计方案
        // this._deleteBolckRec();
    }

    instrumentation() {
        let _ = this;
        Object.keys(CORE_INSTRUMENTATION).forEach(function cb_forEach(mojule) {
            let filename = CORE_INSTRUMENTATION[mojule];
            let filepath = path.join(__dirname, 'core', filename);
            try {
                require(filepath)(_);
            }
            catch (error) {
                logger.error(`module: ${filepath} require error: ${error.stack}`);
            }
        });
    }

    _runLifeCycle() {
        //进入后立即发送一次数据给服务器
        this.__loop();
        //按照设置的定时器定时发送数据给服务器
        let timer = setInterval(this.__loop.bind(this), this.config.loopTime);
    }

    __loop() {
        //记录发送的结束时间
        this.metric.metricData.endTime = Date.now();
        //合并此次发送时当前服务器信息
        this.metric.concatServerMetic();
        //生成数据对象
        let data = _.merge({}, {metricData: this.metric.metricData});
        //组装数据完毕后重新初始化数据
        this.metric._initMetricData(Date.now());
        // this.metric.metricData = {startTime: Date.now(), appId: this.config.appId, data: []};
        //将metricData数据的中
        data.metricData.data = JSON.stringify(data.metricData.data);
        //向服务器发送数据结果的data字段数组转换为JSON字符串,防止request模块处理失败
        this.commu.postDataToServer(this.config.metricPath, data).then(
            // data=>logger.debug(data)
        ).catch(err=>logger.error(err));
    }

    //TODO,不优雅的实现,和PM2的业务耦合度太高,后期替换更好的方案!
    _deleteBolckRec() {
        let that = this;
        // let pm_id = process.env.pm_id;
        //TODO,稍微比PM_ID的方案略微优雅一些,只要使用SIGNAL信号量的守护进程均可通用,后期继续替换更好的方案!
        process.on('exit', function () {
            let redisStoreKey = `${that.config.appName}_${os.hostname()}_${process.pid}`;
            //收到SIGNUL信号的退出方式,删除本次所有记录URL
            if (that.config.redis) {
                that.redis.del(redisStoreKey);
            }
        });
    }
}

module.exports = Agent;