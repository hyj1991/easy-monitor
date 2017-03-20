'use strict';
const path = require('path');
const child_process = require('child_process');
const helper = require('./lib/helper');
const config = helper.loadConfig();
const logger = helper.logger;
const tcpclient = require('./src/tcpclient');

function forkNode(commonConfig) {
    let dashboardProcess = child_process.fork(path.join(__dirname, '../child_process/app.js'), [JSON.stringify(commonConfig)]);

    dashboardProcess.on('exit', signal => {
        if (signal === 0) {
            logger.info(`child_process [${dashboardProcess.pid}] exit with code ${signal}...`);
        } else {
            logger.error(`child_process [${dashboardProcess.pid}] exit with code ${signal}...`);
        }
        dashboardProcess.kill();
    });
}

module.exports = function startEasyMonitor(commonConfig) {
    config.appName = commonConfig.appName || process.title;
    tcpclient(config, helper);
    forkNode(commonConfig);
    helper.event.on('tcp_server_maybe_closed', forkNode.bind(null, commonConfig));
};