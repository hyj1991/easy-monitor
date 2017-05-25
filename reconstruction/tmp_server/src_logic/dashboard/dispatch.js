'use strict';
const net = require('net');
const express = require('express');
const app = express();

app.get('/hello', (req, res, next)=>res.send('Hello 123'))

function createTcpServer(config, common, dbl) {
    const utils = common.utils;

    const server = net.createServer(socket => {
        let chunks = [];
        let size = 0;

        socket.on('data', chunk => {
            chunks.push(chunk);
            size += chunk.length;
            let tmp = Buffer.concat(chunks, size);
            let endSymbol = config.endSymbol;
            let endSymBuf = Buffer.from(endSymbol);

            if (~tmp.indexOf(endSymBuf)) {
                //let tmpArr = utils.bufSplit(tmp, endSymBuf);
                let last = tmpArr.pop();

                chunks = [last];
                size = last.length;

                tmpArr.forEach(item => {
                    //item = utils.parseReceiveMessage(item);
                    logger.debug(`tcpserver->parse data: ${item}`);
                    //item = utils.jsonParse(item);
                    //逻辑处理部分
                    //...
                });
            }

        });

        socket.on('end', () => {
            // helper.deleteCacheSocket(socket.__pid__);
            dbl.error(`tcpserver->end This Socket closed, pid is ${socket.__pid__}`);
        });

        socket.on('error', err => {
            dbl.error(`tcpserver->error ${err}`);
        });
    });

    return server;
}

module.exports = function (config, common, dbl) {
    return { http: app, tcp: createTcpServer(config, common, dbl) };
};