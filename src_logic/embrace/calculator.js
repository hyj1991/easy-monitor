'use strict';

/**
 * @param {*} message 
 * @description 发送数据给主进程
 */
function sendMessage(message) {
    return new Promise((resolve, reject) => {
        process.send(message, function (err) {
            err && reject(err) || resolve();
        });
    })
}

/**
 * @param {object | stream} profiler 
 * @description 进行数据分析
 */
function analytics(profiler) {
    //取出公共部分
    const common = this.common;
    const config = this.config;
    const params = this.params;
    //构建 ctx
    const ctx = { config, common, dbl: common.logger };

    common.profiler.analyticsP.apply(ctx, [params.opt, profiler, {
        start: Date.now(),
        middle: Date.now(),
        /**
         * @param {string} msg @param {number} time @param {boolean} end
         * @description 生成回调 callback 所需参数
         */
        params: function (msg, time, end) {
            const duration = common.utils.formatTime(time - (!end && this.middle || this.start));
            const message = { done: false, loadingMsg: `${msg.prefix || '未知操作'}, 耗时 ${duration}${msg.suffix && `, ${msg.suffix}` || ''}...` };
            this.middle = time;
            return { message };
        },
        callback: sendMessage.bind(ctx)
    }]).then(analysis => {
        return sendMessage({ done: true, analysis });
    }).catch(err => {
        common.logger.error(`child_process calculator-> analytics error: ${err.stack}`);
        return sendMessage({ done: true, error: err });
    }).then(() => {
        //结束并退出计算进程
        process.exit(0);
    });
}

/**
 * @param {object} params @param {object} config @param {object} common
 * @description 监听正常发送的数据
 */
function onRegularMessage(params, config, common) {
    process.on('message', profiler => {
        //启动分析
        analytics.apply({ params, config, common }, [profiler]);
    });
}

/**
 * @param {object} params @param {object} config @param {object} common
 * @description 监听流式输入的数据
 */
function onStreamMessage(params, config, common) {
    //此处 process.stdin 实际上就是 profiler 流
    const profiler = process.stdin;
    //启动分析
    analytics.apply({ params, config, common }, [profiler]);
}

/**
 * @description 启动入口
 */
function start() {
    const path = require('path');
    const rootPath = path.join(__dirname, '../');
    const _common = require(path.join(rootPath, 'common/common'));
    const params = JSON.parse(process.argv[2]);

    //加载出最终的 config & common 项
    const common = _common({ pre: ['config', 'logger', 'utils', 'cache'], param: { config: params } });
    const _require = common.require;
    const config = common.config;

    //给处理函数传入原始参数，无论采用流式传输还是字符串传输均可进行数据解析
    const notStream = Boolean(config && config.profiler && config.profiler[params.opt] && config.profiler[params.opt].optional && config.profiler[params.opt].optional.not_stream);
    if (params.opt === 'cpu') onRegularMessage(params, config, common);
    if (params.opt === 'mem') {
        if (notStream) onRegularMessage(params, config, common);
        else onStreamMessage(params, config, common);
    }
}

//启动计算函数
start();
