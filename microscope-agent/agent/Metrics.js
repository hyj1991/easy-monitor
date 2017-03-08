/**
 * Created by huangyijun on 16/11/11.
 */
'use strict';
const os = require('os');

class Metrics {
    constructor(config, initTime) {
        this.config = config;
        this._initMetricData(initTime);
    }

    concatMetric(data) {
        data = Array.isArray(data) && data || [data];
        this.metricData.data = Array.isArray(this.metricData.data) && this.metricData.data || Array.from(this.metricData.data);
        this.metricData.data = this.metricData.data.concat(data);
        // this.metricData.data = Array.isArray(this.metricData.data) && this.metricData.data || Array.from(this.metricData.data);
        // data.forEach(item=>)
    }

    concatServerMetic() {
        this.metricData.serverMetric = {
            hostName: os.hostname(),
            cpu: (os.loadavg().reduce((pre, next)=>pre = pre + Number(next), 0)) / os.loadavg().length,
            memory: process.memoryUsage().heapTotal / 1024 / 1024
        }
    }

    _initMetricData(initTime) {
        //清空上次数据收集记录
        this.metricData = null;
        //初始化数据收集
        this.metricData = {startTime: initTime, appId: this.config.appId, data: [], env: this.config.env};
    }
}

module.exports = Metrics;