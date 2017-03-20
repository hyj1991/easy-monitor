'use strict';
const path = require('path');
const logger = require('../../common_library/Logger');
const EventEmitter = require('events').EventEmitter;
const event = new EventEmitter();

function _loadConfig() {
    let config = require(path.join(__dirname, '../config/config.js'));
    Object.setPrototypeOf(config, require(path.join(__dirname, '../../common_config/config.js')));
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