'use strict';
const path = require('path');

module.exports = function (_common, config, logger, utils) {

    /**
     * @param {string} mp middleware 所在根路径
     * @param {object} handle express 框架对应的 app 句柄
     */
    function load(mp, handle) {
        const ctx = this;
        const mwList = _common.getFileList(mp, `./**/*middleware.*.js`);
        mwList.forEach(mwFile => {
            try {
                require(mwFile).call(ctx, handle);
            } catch (e) { ctx.dbl && ctx.dbl.error(`load <${mwFile}> error: ${e}`); }
        });
    }

    return { load };
}