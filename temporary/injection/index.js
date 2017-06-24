'use strict';
const cpuProfiler = require('./lib/cpu');

module.exports = function easyMonitor(dashbord) {
    //Start a Tcp Client, that connect to Fork Process
    cpuProfiler.call(null, require('./lib/helper').loadConfig(), dashbord);
};
