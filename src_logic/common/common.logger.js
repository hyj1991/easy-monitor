'use strict';
/**
 * @open-source: 此轻量简便的 Logger 模块源自开源项目 Memeye，感谢作者的开源精神
 * @open-source-address: 项目原地址：https://github.com/JerryC8080/Memeye
 */
const colors = require('colors/safe');

colors.setTheme({
    info: 'green',
    warn: 'yellow',
    debug: 'blue',
    error: 'red'
});

const levelMap = {
    'nolog': -1,
    'error': 0,
    'warn': 1,
    'info': 2,
    'debug': 3,
};

//冻结日志级别对象
Object.freeze(levelMap);

/**
 * @param {number} level * @param {string} prefix 
 * @description 日志类构造方法，设置日志级别以及前缀
 */
function Logger(level, prefix) {
    prefix = prefix || '';

    this.setLevel.call(this, level);
    this.prefix = prefix || '';
    this.levelMap = levelMap;
}

/**
 * @param {number | string} level
 * @description 原型方法，设置日志级别
 */
Logger.prototype.setLevel = function (level) {
    if (typeof level !== 'string' && typeof level !== 'number') level = 2;
    if (typeof level === 'string') level = levelMap[level];
    return this.level = level;
};

/**
 * @param {string} addition
 * @description 原型方法，增加额外日志前缀
 */
Logger.prototype.addPrefix = function (addition) {
    this.prefix = this.prefix + addition;
}

/**
 * @param {string} msg
 * @description 原型方法，打印错误级别日志
 */
Logger.prototype.error = function (msg) {
    if (this.level >= levelMap['error']) console.log(colors['error'](this.prefix + msg))
};

/**
 * @param {string} msg
 * @description 原型方法，打印警告级别日志
 */
Logger.prototype.warn = function (msg) {
    if (this.level >= levelMap['warn']) console.log(colors['warn'](this.prefix + msg))
};

/**
 * @param {string} msg
 * @description 原型方法，打印 INFO 级别日志
 */
Logger.prototype.info = function (msg) {
    if (this.level >= levelMap['info']) console.log(colors['info'](this.prefix + msg))
};

/**
 * @param {string} msg
 * @description 原型方法，打印 DEBUG 级别日志
 */
Logger.prototype.debug = function (msg) {
    if (this.level >= levelMap['debug']) console.log(colors['debug'](this.prefix + msg))
};

module.exports = function (_common, config) {
    const logLevel = config.logger && config.logger.log_level;
    const defaultLogger = new Logger(logLevel, '[Easy-Monitor] ');
    defaultLogger.Logger = Logger;
    return defaultLogger;
}