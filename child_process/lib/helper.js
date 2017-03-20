'use strict';
const path = require('path');
const logger = require('../../common_library/Logger');
const EventEmitter = require('events').EventEmitter;
const event = new EventEmitter();

const cacheMap = {};

function _loadConfig() {
    let commonConfig = {};
    try {
        commonConfig = JSON.parse(process.argv[2]);
    } catch (e) {
        commonConfig = require(path.join(__dirname, '../../common_config/config.js'));
    }
    let config = require(path.join(__dirname, '../config/config.js'));
    Object.setPrototypeOf(config, commonConfig);
    return config;
}

const config = _loadConfig();

logger.setLevel(config.LOG_LEVEL);

module.exports = {
    logger,

    event,

    loadConfig(){
        return config;
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