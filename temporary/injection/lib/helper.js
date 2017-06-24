/**
 * @description Helper方法集合
 */
'use strict';
const path = require('path');
const fs = require('fs');

module.exports = {
    //wrap第三方模块的方法
    wrapMethod(nodule, noduleName, methods, wrapper) {
        methods = Array.isArray(methods) && methods || [methods];
        methods.forEach(item => {
            // logger.debug(`start wrapping ${noduleName}.${item}...`);
            nodule[item] = wrapper(nodule[item]);
        });
    },

    //根据主Module查找查找引入包的目录
    lookupPath(moduleName, pathArr){
        pathArr = pathArr || process.mainModule.paths;
        pathArr = Array.isArray(pathArr) && pathArr || [pathArr];
        let realPathObject = pathArr.reduce((pre, next) => {
            //如果已经查找到,直接返回
            if (pre.isFound) {
                return pre;
            }
            let stat = null;
            try {
                let modulePathTmp = path.join(next, moduleName);
                stat = fs.statSync(modulePathTmp);
                pre.realPath = pre.realPath + String(modulePathTmp);
                pre.isFound = true;
            } catch (err) {
                // logger.error(err.stack);
            }
            return pre;
        }, {realPath: '', isFound: false});
        return realPathObject.realPath;
    },

    //引入内部包方法
    innerRequire(moduleName){
        let modulePath = module.exports.lookupPath(moduleName);
        let result = {};
        if (!modulePath) {
            return false
        }
        result = require(modulePath);
        return result;
    },

    //加载配置文件
    loadConfig(){
        return require(path.join(__dirname, '../config/config.js'));
    }
};
