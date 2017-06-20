'use strict';
const path = require('path');

module.exports = {
    VIEW_PATH: path.join(__dirname, '../view'),

    LISTEN_PORT_TCP: 26666,

    MESSAGE_TYPE: {
        0: 'HEART_BEAT_REQUEST',
        1: 'HEART_BEAT_RESPONSE',
        2: 'DO_CPU_PROFILER',
        3: 'CPU_PROFILER_MESSAGE',
        4: 'DO_MEM_PROFILER',
        5: 'MEM_PROFILER_MESSAGE'
    }
};