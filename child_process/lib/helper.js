'use strict';
const vm = require('vm');
const path = require('path');
const logger = require('../../common_library/Logger');
const EventEmitter = require('events').EventEmitter;
const event = new EventEmitter();
const zlib = require('zlib');

const cacheMap = {};

function _loadConfig() {
    let commonConfig = {};
    try {
        commonConfig = JSON.parse(process.argv[2]);
    } catch (e) {
        commonConfig = require(path.join(__dirname, '../../common_config/config.js'));
    }

    if (commonConfig.monitorAuth && typeof commonConfig.monitorAuth === 'string') {
        commonConfig.monitorAuth = vm.runInThisContext(`(${commonConfig.monitorAuth})`);
    }

    let config = require(path.join(__dirname, '../config/config.js'));
    Object.setPrototypeOf(config, commonConfig);
    return config;
}

const config = _loadConfig();

logger.setLevel(config.LOG_LEVEL);

function _findNode(arraySource, type, value, cb) {
    arraySource.forEach(item => {
        if (item[type] === value) {
            cb(item);
        }
    })
}

module.exports = {
    logger,

    event,

    loadConfig(){
        return config;
    },

    httpListenSuccess(port){
        logger.info(`Child_Process [${process.pid}] Monitor_Http Start At ${port}...`);
    },

    tcpListenSuccess(port){
        logger.info(`Child_Process [${process.pid}] Monitor_Tcp Start At ${port}...`);
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

    formatSize(size){
        let str = '';
        if (size / 1024 < 1) {
            str = `${size} bytes`;
        } else if (size / 1024 / 1024 < 1) {
            str = `${(size / 1024).toFixed(2)} KB`;
        } else if (size / 1024 / 1024 / 1024 < 1) {
            str = `${(size / 1024 / 1024).toFixed(2)} MB`;
        } else {
            str = `${(size / 1024 / 1024 / 1024).toFixed(2)} GB`;
        }

        return str;
    },

    setExpandOff(forceGraph, data){
        let nodesOption = forceGraph.nodes;
        let linksOption = forceGraph.links;
        let linksNodes = [];

        if (data.flag) {
            for (let m in linksOption) {
                if (linksOption[m].source == data.id) {
                    linksNodes.push(linksOption[m].target);
                }
            }
            if (linksNodes != null && linksNodes != undefined) {
                for (let p in linksNodes) {
                    _findNode(nodesOption, 'id', linksNodes[p], node => {
                        node.ignore = false;
                        node.flag = true;
                    });
                }
            }
            _findNode(nodesOption, 'id', data.id, node => {
                node.ignore = false;
                node.flag = false;
                node.category = 0;
            });
        } else {
            for (let m in linksOption) {
                if (linksOption[m].source == data.id) {
                    linksNodes.push(linksOption[m].target);
                }
                if (linksNodes != null && linksNodes != undefined) {
                    for (let n in linksNodes) {
                        if (linksOption[m].source == linksNodes[n] && linksOption[m].target != data.id) {
                            linksNodes.push(linksOption[m].target);
                        }
                    }
                }
            }

            if (linksNodes != null && linksNodes != undefined) {
                for (let p in linksNodes) {
                    _findNode(nodesOption, 'id', linksNodes[p], node => {
                        node.ignore = true;
                        node.flag = true;
                    });
                }
            }

            _findNode(nodesOption, 'id', data.id, node => {
                node.ignore = true;
                node.flag = true;
                node.category = 1;
            });
        }
    },

    catchNode(nodes, key, value){
        return nodes.filter(item => Number(item[key]) === Number(value))[0];
    },

    parseReceiveMessage(msg, needZlib = true){
        msg = Buffer.from(msg);
        if (needZlib) {
            msg = zlib.inflateSync(msg)
        }

        return String(msg);
    },

    bufSplit(buf, sym) {
        buf = Buffer.isBuffer(buf) && buf || Buffer.from(buf);
        sym = Buffer.isBuffer(sym) && sym || Buffer.from(sym);

        let offset = 0;
        let array = [];

        let symIndex = buf.indexOf(sym, offset);

        while (~symIndex) {
            array.push(buf.slice(offset, symIndex));

            offset = symIndex + sym.length;
            symIndex = buf.indexOf(sym, offset);
        }

        array.push(buf.slice(offset));
        return array;
    },

    writeFile(dirname, relate, data){
        const path = require('path');
        const fs = require('fs');

        fs.writeFileSync(path.join(dirname, relate), data);
    }
    
};