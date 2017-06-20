'use strict';
const v8Profiler = require('v8-profiler');
const EventEmitter = require('events').EventEmitter;
const event = new EventEmitter();

let isDoingProfiling = false;

function doMemProfiler(title, config, callback) {
    if (isDoingProfiling) {
        event.once('memory_profiling_complete', callback);
        return false;
    }
    isDoingProfiling = true;

    let snapshot = v8Profiler.takeSnapshot();
    snapshot.export(function (error, result) {
        callback(error, result);
        snapshot.delete();
        event.emit('memory_profiling_complete', null, result);
        isDoingProfiling = false;
    });

    return true;
}

module.exports = doMemProfiler;