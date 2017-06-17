'use strict';

/**
 * @param appName: String or Object
 * @returns config: Object
 */
function getCommonConfig(appName) {
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
    return config;
}

function easyMonitor(appName) {
    let commonConfig = getCommonConfig(appName);
    require('./main_process')(commonConfig);
}

easyMonitor.getCommonConfig = getCommonConfig;
module.exports = easyMonitor;
