/**
 * Created by huangyijun on 16/11/11.
 */
'use strict';
const request = require('@tuniu/request');

class Communication {
    constructor(config) {
        this.config = config
    }

    postDataToServer(path, data) {
        let that = this;
        return new Promise(function (resolve, reject) {
            let host = that.config && that.config.server && that.config.server.host;
            let port = that.config && that.config.server && that.config.server.port;
            request({
                url: `http://${host}:${port}${path}`,
                method: 'post',
                // form: JSON.stringify(data)
                form: data
            }, function responseHandle(err, res, data) {
                if (err) {
                    return reject(err);
                }
                let statusCode = res.statusCode;
                resolve({statusCode, data});
            });
        });
    }
}

module.exports = Communication;