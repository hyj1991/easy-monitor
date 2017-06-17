'use strict';
module.exports = {
    CPU_PROFILING_TIME: 5 * 1000,

    CHECK_RECEIVE_MESSAGE: 1000,

    HEART_BEAT_INTERVAL: 60 * 1000,

    MESSAGE_TYPE: {
        0: 'HEART_BEAT_REQUEST',
        1: 'HEART_BEAT_RESPONSE',
        2: 'DO_CPU_PROFILER',
        3: 'CPU_PROFILER_MESSAGE'
    },

    TCP_CONNECTION_CONFIG: {
        host: '127.0.0.1',
        port: 8082
    },

    FUNCTIONS_ANALYSIS: {
        LONG_FUNCTIONS_LIMIT: 10,
        LONG_FUNCTIONS_TIMEOUT: 50,
        BAILOUT_FUNCTIONS_LIMIT: 5
    }
};