'use strict';

module.exports = function (_common, config, logger, utils) {
    /**
     * @param {string} type 加载的 controller 类型
     * @param {string} cp 加载的 controller 根路径
     * @param {object} handle 对应的服务器句柄
     * @description 用于自动加载 http / tcp 类型的 controller 文件
     */
    function load(type, cp, handle) {
        const ctx = this;
        const ctrList = _common.getFileList(cp, `./**/*${type}.*.js`);
        ctrList.forEach(ctrFile => {
            try {
                require(ctrFile).call(ctx, handle);
            } catch (e) { ctx.dbl && ctx.dbl.error(`load ${type} <${ctrFile}> error: ${e}`); }
        });
    }

    return { load };
}