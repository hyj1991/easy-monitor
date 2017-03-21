'use strict';
const assert = require('assert');
const easyMonitor = require('../');

describe('index.js', () => {
    before(() => {
        easyMonitor({appName: 'My Project', logLevel: 0});
    });

    it('commonConfig.appName must equal My Project', () => {
        assert(easyMonitor.getCommonConfig('My Project').appName === 'My Project');
    });

    it('commonConfig.LOG_LEVEL must equal 3', () => {
        assert(easyMonitor.getCommonConfig({logLevel: 3}).LOG_LEVEL === 3);
    });

    it('commonConfig.HTTP_SERVER_PORT must equal 8888', () => {
        assert(easyMonitor.getCommonConfig({httpServerPort: 8888}).HTTP_SERVER_PORT === 8888);
    });

    it('commonConfig.monitorAuth must be toString', () => {
        let tmpFunction = function tmp() {
            return true;
        };
        assert(easyMonitor.getCommonConfig({monitorAuth: tmpFunction}).monitorAuth === tmpFunction.toString());
    });
});