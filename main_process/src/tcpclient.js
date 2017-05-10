'use strict';
const net = require('net');
const cpuProfiler = require('./cpuprofiler');
const heapSnapshot = require('./heapsnapshot');
const analysisLib = require('v8-analytics');

module.exports = function (config, helper) {
    const logger = helper.logger;

    let reconnectTimes = 0;

    let client = new net.Socket();
    let heartBeatMessage = JSON.stringify({
        type: config.MESSAGE_TYPE[0],
        data: JSON.stringify({pid: `${config.appName}::${process.pid}`})
    });

    function callbackListener() {
        logger.info(`connect to ${config.TCP_INFO.HOST}:${config.TCP_INFO.PORT} success...`);
        reconnectTimes = 0;
        helper.sendMessage(client, heartBeatMessage);
    }

    function connect() {
        client.connect(config.TCP_INFO.PORT, config.TCP_INFO.HOST, callbackListener);
    }

    connect();

    //send heartbeat message interval
    setInterval(() => helper.sendMessage(client, heartBeatMessage), config.HEARTBEAT_TIME);

    let chunks = [];
    let size = 0;
    client.on('data', function (chunk) {
        chunks.push(chunk);
        size += chunk.length;
        let tmp = (Buffer.concat(chunks, size)).toString();
        if (~tmp.indexOf('\n\n')) {
            let tmpArr = tmp.split('\n\n');
            let last = Buffer.from(tmpArr.pop());

            chunks = [last];
            size = last.length;

            tmpArr.forEach(item => {
                logger.debug(`tcpclient->parse data: ${item}`);
                item = helper.jsonParse(item);
                if (item.type === config.MESSAGE_TYPE[2]) {
                    item.data = helper.jsonParse(item.data);
                    logger.info(`tcpclient->will start cpu profiling...`);
                    cpuProfiler(item.data.uuid, config, profiler => {
                        let result = {
                            type: config.MESSAGE_TYPE[3],
                            uuid: item.data.uuid,
                            data: JSON.stringify({
                                longFunctions: analysisLib(profiler, item.data.timeout || 500, false, true, {limit: item.data.long_limit || config.FUNCTIONS_ANALYSIS.LONG_FUNCTIONS_LIMIT}, config.filterFunction),
                                topExecutingFunctions: analysisLib(profiler, 1, false, true, {limit: item.data.top_limit || config.FUNCTIONS_ANALYSIS.TOP_EXECUTING_FUNCTIONS}, config.filterFunction),
                                bailoutFunctions: analysisLib(profiler, null, true, true, {limit: item.data.bail_limit || config.FUNCTIONS_ANALYSIS.BAILOUT_FUNCTIONS_LIMIT}, config.filterFunction)
                            })
                        };
                        helper.sendMessage(client, result);
                    });
                }

                if (item.type === config.MESSAGE_TYPE[4]) {
                    item.data = helper.jsonParse(item.data);
                    logger.info(`tcpclient->will start memory profiling...`);
                    heapSnapshot(item.data.uuid, config, (err, heapData) => {
                        logger.info(`tcpclient->memory profiling end...`);
                        let result = {
                            type: config.MESSAGE_TYPE[5],
                            uuid: item.data.uuid,
                            data: JSON.stringify({})
                        };

                        if (err) {
                            return helper.sendMessage(client, result);
                        }

                        //heap data is too big, so send it to child_process process
                        result.data = heapData;
                        helper.sendMessage(client, result);
                    });
                }
            });
        }
    });

    client.on('error', function (error) {
        logger.debug(`tcpclient->error pid ${process.pid} ${error}`);
    });

    client.on('close', function () {
        if (++reconnectTimes === 10) {
            helper.event.emit('tcp_server_maybe_closed');
            reconnectTimes = 0;
        }
        logger.debug(`tcpclient->close pid ${process.pid} tcp connection closed`);
        //when socket close, remove original listener to avoid memory leak
        client.removeListener('connect', callbackListener);
        client.destroy();
        setTimeout(connect, 200);
    });
};