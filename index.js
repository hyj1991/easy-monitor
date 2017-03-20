'use strict';
function easyMonitor(appName) {
    let config = require('./common_config/config');
    if (typeof appName === 'object') {
        Object.assign(config, appName);
    } else {
        config.appName = appName;
    }

    require('./main_process')(config);
}

module.exports = easyMonitor;