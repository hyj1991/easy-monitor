'use strict';
const path = require('path');
const logger = require('../../common/Logger');
const EventEmitter = require('events').EventEmitter;
const event = new EventEmitter();


const cacheMap = {};

module.exports = {
    logger,

    event,

    loadConfig(){
        return require(path.join(__dirname, '../config/config.js'));
    },

    httpListenSuccess(port){
        logger.info(`Child_Process Monitor_Http Start At ${port}...`);
    },

    tcpListenSuccess(port){
        logger.info(`Child_Process Monitor_Tcp Start At ${port}...`);
    },

    cacheSocket(pid, socket){
        cacheMap[pid] = socket;
    },

    getCachedSocket(){
        return cacheMap;
    },

    deleteCacheSocket(pid){
        delete cacheMap[pid];
    },

    jsonParse(str){
        let result = {};
        try {
            result = JSON.parse(str);
        } catch (e) {
            logger.error('helper->jsonParse', e);
        }
        return result;
    },
};