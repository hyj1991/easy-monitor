'use strict';
const net = require('net');


module.exports = function (config, helper) {
    const logger = helper.logger;
    const event = helper.event;

    const server = net.createServer(socket => {
        let chunks = [];
        let size = 0;

        socket.on('data', chunk => {
            chunks.push(chunk);
            size += chunk.length;
            let tmp = Buffer.concat(chunks, size);
            let endSymbol = '@#$%\r\n';
            let endSymBuf = Buffer.from(endSymbol);

            if (~tmp.indexOf(endSymBuf)) {
                // let tmpArr = tmp.split('\n\n');
                // let last = Buffer.from(tmpArr.pop());
                let tmpArr = helper.bufSplit(tmp, endSymBuf);
                let last = tmpArr.pop();

                chunks = [last];
                size = last.length;

                tmpArr.forEach(item => {
                    item = helper.parseReceiveMessage(item);
                    logger.debug(`tcpserver->parse data: ${item}`);
                    item = helper.jsonParse(item);
                    if (item.type === config.MESSAGE_TYPE[3]) {
                        event.emit(item.uuid, helper.jsonParse(item.data))
                    }

                    if (item.type === config.MESSAGE_TYPE[5]) {
                        event.emit(item.uuid, helper.jsonParse(item.data))
                    }

                    if (item.type === config.MESSAGE_TYPE[0]) {
                        let pid = helper.jsonParse(item.data).pid;
                        socket.__pid__ = pid;
                        helper.cacheSocket(pid, socket);
                    }

                    socket.write(JSON.stringify({
                            type: config.MESSAGE_TYPE[1],
                            data: JSON.stringify({})
                        }) + '\n\n');
                });
            }

        });

        socket.on('end', () => {
            helper.deleteCacheSocket(socket.__pid__);
            logger.error(`tcpserver->end This Socket closed, pid is ${socket.__pid__}`);
        });

        socket.on('error', err => {
            logger.error(`tcpserver->error ${err}`);
        });
    });

    server.on('error', err => {
        logger.info(`tcp server has been started, this [${process.pid}] will be closed...`);
        server.close();
        process.exit(0);
    });

    return server;
};