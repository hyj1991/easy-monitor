'use strict';
const v8Profiler = require('v8-profiler');

let isDoingProfiling = false;

function doCpuProfiler(title, config, callback) {
    if (isDoingProfiling) {
        return;
    }
    v8Profiler.startProfiling(title, true);

    setTimeout(() => {
        let profiler = v8Profiler.stopProfiling(title);
        profiler.delete();
        callback(profiler);
    }, config.CPU_PROFILING_TIME)
}

module.exports = doCpuProfiler;