'use strict';
const net = require('net');
const cpuProfiler = require('./cpuprofiler');
const analysisLib = require('v8-cpu-analysis');

module.exports = function (config, helper) {
    const logger = helper.logger;

    let client = new net.Socket();
    let heartBeatMessage = JSON.stringify({
            type: config.MESSAGE_TYPE[0],
            data: JSON.stringify({pid: `${config.appName}::${process.pid}`})
        }) + '\n\n';

    function callbackListener() {
        logger.info(`connect to ${config.TCP_INFO.HOST}:${config.TCP_INFO.PORT} success...`);
        client.write(heartBeatMessage);
    }

    function connect() {
        client.connect(config.TCP_INFO.PORT, config.TCP_INFO.HOST, callbackListener);
    }

    connect();

    //send heartbeat message interval
    setInterval(() => client.write(heartBeatMessage), config.HEARTBEAT_TIME);

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
                                longFunctions: analysisLib(profiler, item.data.timeout || 500, false, true, {limit: config.FUNCTIONS_ANALYSIS.LONG_FUNCTIONS_LIMIT}),
                                bailoutFunctions: analysisLib(profiler, null, true, true, {limit: config.FUNCTIONS_ANALYSIS.BAILOUT_FUNCTIONS_LIMIT})
                            })
                        };
                        client.write(JSON.stringify(result) + '\n\n');
                    });
                }
            });
        }
    });

    client.on('error', function (error) {
        logger.debug(`tcpclient->error pid ${process.pid} ${error}`);
    });

    client.on('close', function () {
        logger.debug(`tcpclient->close pid ${process.pid} tcp connection closed`);
        //when socket close, remove original listener to avoid memory leak
        client.removeListener('connect', callbackListener);
        client.destroy();
        setTimeout(connect, 200);
    });
};