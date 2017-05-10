'use strict';
const path = require('path');

module.exports = {
    TCP_INFO: {
        HOST: '127.0.0.1',
        PORT: '26666'
    },

    MESSAGE_TYPE: {
        0: 'HEART_BEAT_REQUEST',
        1: 'HEART_BEAT_RESPONSE',
        2: 'DO_CPU_PROFILER',
        3: 'CPU_PROFILER_MESSAGE',
        4: 'DO_MEM_PROFILER',
        5: 'MEM_PROFILER_MESSAGE'
    },

    HEARTBEAT_TIME: 60 * 1000,

    CPU_PROFILING_TIME: 5 * 1000,

    FUNCTIONS_ANALYSIS: {
        LONG_FUNCTIONS_LIMIT: 5,
        TOP_EXECUTING_FUNCTIONS: 5,
        BAILOUT_FUNCTIONS_LIMIT: 10
    }
};