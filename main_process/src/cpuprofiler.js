'use strict';
const v8Profiler = require('v8-profiler');
const EventEmitter = require('events').EventEmitter;
const event = new EventEmitter();

let isDoingProfiling = false;

function doCpuProfiler(title, config, callback) {
    if (isDoingProfiling) {
        event.once('cpu_profiling_complete', callback);
        return false;
    }
    isDoingProfiling = true;
    v8Profiler.startProfiling(title, true);

    setTimeout(() => {
        let profiler = v8Profiler.stopProfiling(title);
        profiler.delete();
        callback(profiler);
        event.emit('cpu_profiling_complete', profiler);
        isDoingProfiling = false;
    }, config.CPU_PROFILING_TIME);
    return true;
}

module.exports = doCpuProfiler;