'use strict';

module.exports = function (_common, config, logger) {
    function onSocket(utils, dbl, socket, controller) {
        dbl.debug(`receive socket connection...`);
        let chunks = [];
        let size = 0;

        socket.on('data', chunk => {
            chunks.push(chunk);
            size += chunk.length;
            let tmp = Buffer.concat(chunks, size);
            let endSymbol = config.endSymbol;
            let endSymBuf = Buffer.from(endSymbol);

            if (~tmp.indexOf(endSymBuf)) {
                const tmpArr = utils.bufSplit(tmp, endSymBuf);
                const last = tmpArr.pop();

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
            //dbl.error(`tcpserver->end This Socket closed, pid is ${socket.__pid__}`);
        });

        socket.on('error', err => {
            dbl.error(`tcpserver->error ${err}`);
        });
    }

    return { on: onSocket }
}