/**
 * Created by huangyijun on 16/11/15.
 */
'use strict';

class Collect {
    constructor(config, ctrObj) {
        this.config = config;
        this.ctrObj = ctrObj;
        this.starttime = Date.now();
    }

    requestEnd(agent) {
        this.stoptime = Date.now();

        let collectObj = {};
        collectObj['type'] = 'SERVER_REQUEST';
        collectObj['startTime'] = this.starttime;
        collectObj['stopTime'] = this.stoptime;
        collectObj['execTime'] = this.stoptime - this.starttime;
        collectObj['url'] = this.ctrObj.request.url;
        collectObj['statusCode'] = this.ctrObj.response && this.ctrObj.response.statusCode || 404;
        collectObj['error'] = this.ctrObj.response.__telescope_error__ || '';
        agent.metric.concatMetric(collectObj);
    }

    innerServiceEnd(agent) {
        this.stoptime = Date.now();

        let collectObj = {};
        collectObj['type'] = 'BACK_SERVICE';
        collectObj['startTime'] = this.starttime;
        collectObj['stopTime'] = this.stoptime;
        collectObj['execTime'] = this.stoptime - this.starttime;
        collectObj['url'] = this.ctrObj.options.url;
        collectObj['method'] = this.ctrObj.options.method;
        collectObj['statusCode'] = this.ctrObj.response && this.ctrObj.response.statusCode || 500;
        collectObj['error'] = this.ctrObj.error || '';

        // console.log(12333, collectObj);
        agent.metric.concatMetric(collectObj);
    }
}

module.exports = Collect;