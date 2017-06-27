/**
 * @description 定时器原始类
 */
'use strict';

class Timer {
    constructor(callback, after, repeat) {
        this._cb = callback;
        this._after = after;
        this._repeat = repeat;

        //下面是为了生成隐藏类做的优化
        this._idlePrev = null;
        this._idleNext = null;
    }
}

module.exports = Timer;