'use strict';
const path = require('path');
const logger = require('../../common_library/Logger');
const EventEmitter = require('events').EventEmitter;
const event = new EventEmitter();
const zlib = require('zlib');

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

    sendMessage(client, msg, failedMsg, needZlib = true, endSym = '@#$%\r\n'){
        msg = typeof msg === 'object' && JSON.stringify(msg) || msg;

        if (!client) {
            return false;
        }

        if (needZlib) {
            zlib.deflate(msg, (err, buffer) => {
                if (err && failedMsg) {
                    return client.write(failedMsg);
                }

                let endSymBuf = Buffer.from(endSym);
                const newBuf = Buffer.concat([buffer, endSymBuf], buffer.length + endSymBuf.length);

                client.write(newBuf);

            });
            return true;
        }

        client.write(msg + endSym);
        return true;
    }
};