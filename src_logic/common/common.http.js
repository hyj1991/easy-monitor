'use strict';

module.exports = function (_common, config, logger, utils) {
    /**
     * @param {number} code @param {string} msg
     * @description 组装 axios 请求的响应体
     */
    function composeMessage(code, msg) {
        //将 msg 转换为字符串
        msg = typeof msg === 'string' && msg || JSON.stringify(msg);

        const message = { success: true, code };
        //如果有 error 字段，则将 success 字段置为 false
        if (Number(code) !== 0) {
            const error = config.http[Number(code)] || '未知错误';
            message.error = typeof error === 'function' && error(msg) || error;
            message.success = false;
        }
        //填充 msg 字段
        if (msg) {
            message.data = msg;
        }

        return JSON.stringify(message);
    }

    return { composeMessage }
}