'use strict';
const path = require('path');
const logger = require('../../common/Logger');
const EventEmitter = require('events').EventEmitter;
const event = new EventEmitter();

module.exports = {
    logger,

    event,

    loadConfig(){
        return require(path.join(__dirname, '../config/config.js'));
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