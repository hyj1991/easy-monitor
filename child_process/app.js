/**
 * This is child_process, we start a Http Server and a Tcp Server
 * to provide two main functions：
 * 1. provide some web pages which can show users cpu/mem statistics
 * 2. communication with main process so we can send some unique cmds
 */
'use strict';
const path = require('path');
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const serverFavicon = require('serve-favicon');
const router = require('./src/router');
const helper = require('./lib/helper');
const tcp = require('./src/tcpserver');
const config = helper.loadConfig();

//set view engine
app.set('views', config.VIEW_PATH);
app.set('view engine', 'ejs');

//use some middleware
app.use(express.static(path.join(__dirname, './public')));
app.use(serverFavicon(path.join(__dirname, './public/favicon.ico')));
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({extended: false, limit: '10mb'}));

//set router
router(app, config, helper);

//listen application
tcp(config, helper).listen(config.LISTEN_PORT_TCP, helper.tcpListenSuccess(config.LISTEN_PORT_TCP));
const httpServer = app.listen(config.HTTP_SERVER_PORT, helper.httpListenSuccess(config.HTTP_SERVER_PORT));
httpServer.on('error', err => {
    helper.logger.info(`http server has been started, this [${process.pid}] will be closed...`);
    httpServer.close();
    process.exit(0);
});