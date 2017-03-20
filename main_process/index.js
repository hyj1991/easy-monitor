'use strict';
const path = require('path');
const child_process = require('child_process');
const helper = require('./lib/helper');
const config = helper.loadConfig();
const logger = helper.logger;
const tcpclient = require('./src/tcpclient');

module.exports = function startEasyMonitor(appName) {
    config.appName = appName || process.title;
    tcpclient(config, helper);

    let dashboardProcess = child_process.fork(path.join(__dirname, '../child_process/app.js'));

    dashboardProcess.on('exit', signal => {
        if (signal === 0) {
            logger.info(`child_process exit with code ${signal}...`);
        } else {
            logger.error(`child_process exit with code ${signal}...`);
        }
        dashboardProcess.kill();
    });
};