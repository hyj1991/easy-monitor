/**
 * Created by huangyijun on 16/11/11.
 */
const os = require('os');
const http = require('http');
const wrapMethod = require('../../lib/helper').wrapMethod;
const innerRequire = require('../../lib/helper').innerRequire;
const request = innerRequire('request');
const express = innerRequire('express');

function wrapped(agent) {
    wrapMethod(http.Server.prototype, 'http.Server.prototype', ['on', 'addListener'], function cb_wrapMethod(addListener) {
        return function cls_wrapMethod(type, listener) {
            if (type === 'request' && typeof listener === 'function') {
                return addListener.call(this, type, wrapListener(agent, listener));
            }
            else {
                return addListener.apply(this, arguments);
            }
        };
    });

    //如果存在request模块
    if (request) {
        wrapMethod(request.Request.prototype, 'request.Request.prototype', ['init'], function init_wrapMethod(init) {
            return function ils_wrapMethod(options) {
                if (options) {
                    this.callback = wrapRequestCb(agent, options, this.callback);
                    return init.call(this, options);
                } else {
                    return init.apply(this, arguments);
                }
            }
        });
    }

    //如果存在express模块
    if (express) {
        wrapMethod(express.application, 'express.application', ['lazyrouter'], function lazy_wrapMethod(lazyrouter) {
            return function als_wrapMethod() {
                //调用原始的lazyrouter函数
                lazyrouter.apply(this, arguments);
                //防止插入多次预注入中间件
                if (!this.__DISPATCH_LAYER__) {
                    this._router.use(modifyLayerErrorHanle);
                    //TODO,暂时屏蔽,等待更好的方案
                    // this._router.use(createcount(agent));
                    this.__DISPATCH_LAYER__ = true;
                }
            }
        });
    }

}

//处理http服务器链接请求
function wrapListener(agent, listener) {
    return function innerListener(request, response) {
        listener(request, response);
        let ctrObj = {request, response};
        let collector = new agent.Colle(agent.config, ctrObj);
        response.once('finish', function finishRequest() {
            collector.requestEnd(agent);
        });

    }
}

//处理http后台服务请求
function wrapRequestCb(agent, options, cb) {
    let ctrObj = {options};
    let collector = new agent.Colle(agent.config, ctrObj);
    return function innerRequestCb(err, response, data) {
        cb(err, response, data);
        let error = '';
        if (err) {
            error = err instanceof Error && err || new Error(err);
            error = {msg: error.message, name: error.name}
        }
        collector.ctrObj = Object.assign(collector.ctrObj, {response, error});
        collector.innerServiceEnd(agent);
    }
}

//拦截Layer的error处理函数
function modifyLayerErrorHanle(req, res, next) {
    //因为modifyLayerErrorHanle函数本身存在
    //则一定会至少有一个中间件,因此访问_router.stack[0]一定是安全的
    let layerInstance = req.app._router.stack[0];
    //进程生命周期内仅调用一次wrap方法,方式stack溢出
    if (layerInstance.__proto__.handle_error && layerInstance.__proto__.handle_error.isWrapped) {
        return next();
    }
    //为了安全不全局改动Layer层的数据,仅在当前app实例下拦截Error处理函数
    wrapMethod(layerInstance.__proto__, 'layerInstance.__proto__', ['handle_error'], function err_wrapMethod(handle_error) {
        let els_wrapMethod = function (error, req, res, next) {
            let fn = this.handle;
            //如果fn的长度为4, 则表明拦截到error
            if (fn.length === 4) {
                error = error instanceof Error && error || new Error(error);
                res.__telescope_error__ = {msg: error.message, name: error.name};
            }

            //按照原始handle_error函数进行处理
            handle_error.apply(this, arguments);
        }
        els_wrapMethod.isWrapped = true;

        return els_wrapMethod;
    });

    next();
}

//记录每次http请求统计数据信息
function createcount(agent) {
    return function countRequestHandle(req, res, next) {
        let redisStoreKey = `${agent.config.appName}_${os.hostname()}_${process.pid}`;
        let traceId = Math.random().toString(16).substr(2, 10) + '_' + Date.now();
        let url = req.path;
        let timestamp = Date.now();
        let setData = JSON.stringify({url, timestamp, hostName: os.hostname()});
        agent.redis.hsetP(redisStoreKey, traceId, setData);
        res.on('finish', function () {
            agent.redis.hdelP(redisStoreKey, traceId);
        });
        next();
    }
}

module.exports = wrapped;