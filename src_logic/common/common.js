'use strict';
const path = require('path');
const glob = require('glob');
const colors = require('colors/safe');
const ext = { prefix: 'common', suffix: 'js' };
const commonBase = `./**/${ext.prefix}.!(heap|model|worker).${ext.suffix}`;

/**
 * @param {string} base @param {string} files
 * @return {array}
 * @description 自动加载指定目录下所有的文件
 */
function getFileList(base, files) {
    const fileList = glob.sync(files, {
        cwd: base,
    }).map(file => {
        return path.join(base, file);
    });
    return fileList;
}

/**
 * 
 * @param {string} base @param {string} files
 * @return {function}
 * @description 根据配置项加载目录下所有的 common 文件
 */
function createLibrary(base, files) {
    /**
     * @param {object} options
     * @return {object}
     */
    return function (options) {

        //比其余 common 文件更先加载
        const preList = options.pre || [];
        const param = options.param || {};
        //查找是否预加载了 logger 模块
        const loggerIndex = preList.indexOf('logger');
        const fileList = getFileList(base, files);
        const preLoad = preList.reduce((pre, name) => {
            let res = {};
            try {
                res = require(path.join(base, `${ext.prefix}.${name}.${ext.suffix}`));
                //如果有预设的额外参数，则增加到参数数组中
                if (param[name]) pre.push(param[name]);
                res = res.apply(null, pre);
                //如果有预设的额外参数，使用完成后清除掉
                if (param[name]) pre.pop();
            } catch (e) { console.error(colors['red'](`[Easy-Monitor] <${ext.prefix}.${name}.${ext.suffix}> pre-load error: ${e}`)) }

            pre.push(res);
            return pre;
        }, [{ getFileList }]);

        const logger = preLoad[loggerIndex + 1];

        const common = { getFileList, createLibrary };
        //以预加载的 common 文件为参数，加载剩余文件
        return fileList.reduce((pre, file) => {
            const basename = path.basename(file);
            const filename = (new RegExp(`${ext.prefix}.(.*).${ext.suffix}`).exec(basename))[1];

            //预加载过的文件保存后剔除
            if (~preList.indexOf(filename)) {
                pre[filename] = preLoad[preList.indexOf(filename) + 1];
                return pre;
            };
            try {
                const fn = require(file);
                preLoad.push(common);
                pre[filename] = fn.apply(null, preLoad);
            } catch (e) { logger & logger.error(`<${basename}> load error: ${e}`) }
            return pre;
        }, common);
    }
}

module.exports = createLibrary(__dirname, commonBase);

