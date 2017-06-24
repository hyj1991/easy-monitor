'use strict';
const path = require('path');
const colors = require('colors/safe');
const EventEmitter = require('events').EventEmitter;
const event = new EventEmitter();
const configPath = path.join(__dirname, '../config');
const lodash = require('lodash');
const ext = { prefix: 'config', suffix: 'js' };

module.exports = function common(_common, userConfig) {
    /**
     * @param {*} userConfig 
     * @return {object}
     * @description 将用户传入的参数进行格式化
     */
    function userConfigSerialize() {
        const uc = {};
        //如果是字符串，则设置为项目 title
        if (typeof userConfig === 'string') {
            uc.project_name = userConfig;
        }
        //如果是对象，则将对象内容合并至结果
        if (typeof userConfig === 'object') {
            //对 logger 配置进行便利化操作
            if (userConfig.log_level || Number(userConfig.log_level) === 0) {
                uc.logger = { "log_level": userConfig.log_level }
            }
            lodash.merge(uc, userConfig);
        }

        return uc;
    }

    /**
     * @param {array} nameList  @param {function} done
     * @description 此配置文件依赖的配置项未全部生成，则设置侦听器等待生成完毕后合并 
     */
    function setEvents(nameList, done) {
        let length = nameList.length;

        nameList.forEach(name => {
            event.once(`${ext.prefix}.${name}.${ext.suffix}`, () => {
                if (!--length) {
                    done();
                }
            });
        });
    }

    /**
     * 
     * @param {object} target @param {object} fn @param {string} ev 
     * @description 将 config 内容合并至主对象中
     */
    function mergeConfig(target, fn, ev) {
        if (typeof fn === 'function') {
            fn = fn.apply(fn, [target]);
        }
        lodash.merge(target, fn, userConfigSerialize());
        event.emit(ev);
    }

    /**
     * @param {string} cp 
     * @return {object}
     * @description 加载配置文件函数
     * @todo 暂时为最简单的实现方式，后期视情况更改
     */
    function loadConfig(cp) {
        const configList = _common.getFileList(configPath, `./**/${ext.prefix}.*.${ext.suffix}`);
        //加入 config.js，此文件中主要包含一些基本配置，处理 config 节点第一级
        configList.push(path.join(configPath, 'config.js'));

        return configList.reduce((pre, file) => {
            //获取文件名
            const basename = path.basename(file);

            try {
                let fn = require(file);
                //判断是否需要排序
                let order = fn.order;
                if (order && order.bef) {
                    /** 
                     * @param {array} bef 表示在该 file 文件之前必须是数组中的文件
                    */
                    let bef = order.bef || [];
                    //判断该 config 文件所需的所有前置配置项均已获得: 如果是则继续走原始 merge 逻辑，否则设置侦听事件
                    const allHave = bef.every(na => Boolean(pre[`${na}`]));
                    if (!allHave) {
                        //筛选出尚未生成的配置项，设置侦听器
                        bef = bef.filter(na => !Boolean(pre[`${na}`]));
                        setEvents(bef, mergeConfig.bind(null, pre, fn, basename));
                        return pre;
                    }
                }
                //合并至主 config 对象
                mergeConfig(pre, fn, basename)
            } catch (e) { console.error(colors['red'](`[Easy-Monitor] <${file}> config-load error: ${e.stack}`)) }
            return pre;
        }, {});
    }

    return loadConfig(configPath);
}