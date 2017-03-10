'use strict';
const cpuProfiler = require('./lib/cpu');

module.exports = function easyMonitor(dashbord) {
    cpuProfiler.call(null, require('./lib/helper').loadConfig(), dashbord);
};
