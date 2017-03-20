const colors = require('colors/safe');

colors.setTheme({
    info: 'green',
    warn: 'yellow',
    debug: 'blue',
    error: 'red'
});

const levelMap = {
    'error': 0,
    'warn': 1,
    'info': 2,
    'debug': 3,
};

Object.freeze(levelMap);

function Logger(level, prefix) {
    level = level || 2;
    prefix = prefix || '';

    this.setLevel.call(this, level);
    this.prefix = prefix;
    this.levelMap = levelMap;
}

Logger.prototype.setLevel = function (level) {
    if (typeof level !== 'string' && typeof level !== 'number') level = 2;
    if (typeof level === 'string') level = levelMap[level];
    return this.level = level;
};

Logger.prototype.error = function (msg) {
    if (this.level >= levelMap['error']) console.log(this.prefix + colors['error'](msg))
};

Logger.prototype.warn = function (msg) {
    if (this.level >= levelMap['warn']) console.log(this.prefix + colors['warn'](msg))
};

Logger.prototype.info = function (msg) {
    if (this.level >= levelMap['info']) console.log(this.prefix + colors['info'](msg))
};

Logger.prototype.debug = function (msg) {
    if (this.level >= levelMap['debug']) console.log(this.prefix + colors['debug'](msg))
};

module.exports = new Logger(2, '[Easy-Monitor]');