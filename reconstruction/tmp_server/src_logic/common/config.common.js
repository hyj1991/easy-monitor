'use strict';
const path = require('path');
const colors = require('colors/safe');
const EventEmitter = require('events').EventEmitter;
const event = new EventEmitter();
const configPath = path.join(__dirname, '../config');
const lodash = require('lodash');
const ext = '.config.js';

module.exports = function abc(_common) {
    /**
     * @param {array} nameList  @param {function} done
     * @description 此配置文件依赖的配置项未全部生成，则设置侦听器等待生成完毕后合并 
     */
    function setEvents(nameList, done) {
        let length = nameList.length;

        nameList.forEach(name => {
            event.on(`${name}${ext}`, () => {
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
        lodash.merge(target, fn);
        event.emit(ev);
    }

    /**
     * @param {string} cp 
     * @return {object}
     * @description 加载配置文件函数
     * @todo 暂时为最简单的实现方式，后期视情况更改
     */
    function loadConfig(cp) {
        const configList = _common.getFileList(configPath, `./**/*${ext}`);
        //将最基础的 config.js 文件置顶
        configList.unshift(path.join(configPath, 'config.js'));

        return configList.reduce((pre, file) => {
            const basename = path.basename(file);
            const name = basename.replace(ext, '');

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