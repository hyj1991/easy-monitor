'use strict';
const assert = require('assert');
const easyMonitor = require('../');
const cpuProfile = require('../main_process/src/cpuprofiler');

describe('main_process', () => {
    before(() => {
        easyMonitor({appName: 'My Project', logLevel: 0});
    });

    it('twice successive profiling only one succeed', () => {
        assert(cpuProfile('test1', {CPU_PROFILING_TIME: 1}, new Function()) === true);
        assert(cpuProfile('test2', {CPU_PROFILING_TIME: 1}, new Function()) === false);
    });
});