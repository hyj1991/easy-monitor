'use strict';
function easyMonitor(appName) {
    let config = require('./common_config/config');
    if (typeof appName === 'object') {
        Object.assign(config, appName);
    } else {
        config.appName = appName;
    }

    if (typeof config.monitorAuth === 'function') {
        config.monitorAuth = config.monitorAuth.toString();
    }

    if (typeof config.logLevel === 'number' || typeof config.logLevel === 'string') {
        config.LOG_LEVEL = config.logLevel;
    }

    if (typeof config.httpServerPort === 'number' || typeof config.httpServerPort === 'string') {
        config.HTTP_SERVER_PORT = config.httpServerPort;
    }

    require('./main_process')(config);
}

module.exports = easyMonitor;