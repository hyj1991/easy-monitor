/**
 * @description 基于C扩展的定时器，在while等进程级别阻塞情况下依旧能运行
 */
'use strict';
const LinkList = require('./internal/LinkList');
const Timer = require('./internal/Timer');
const noBlockTimer = require('../build/Release/addons.node').signal_timer;

const timerList = {};

//检查是否有定时器到期,并且按照顺序执行掉所有的超时定时器回调
function checkTimer() {
    let afterList = Object.keys(timerList);
    let minTimerList = afterList.filter(loopTime => loopTime <= Date.now());
    minTimerList.forEach(minTimer => {
        let first;
        while (first = timerList[minTimer].shift()) {
            //执行定时器回调函数
            first._cb();
            //如果需要重复，重新加入队列
            if (first._repeat) {
                addTimer(first._cb, first._after, first._repeat);
            }
        }
        //删除整个定时器List
        delete timerList[minTimer];
    });
}

//注册定时检查定时器检查函数
noBlockTimer.register(checkTimer, 1);

//增加定时器
function addTimer(callback, after, repeat) {
    if (!callback || typeof callback !== 'function') {
        throw new Error('第一个参数必须是函数!');
    }

    if (Object.keys(timerList).length > 100) {
        console.warn("注意：agent模块当前定时器数量超过100，请当心内存泄漏！");
    }

    //默认定时器间隔1s后过期
    after = typeof after === 'number' && after || Number(after) || 1000;

    //是否需要重复执行，默认是不需要的
    repeat = Boolean(repeat);

    let clamped_timeout = Date.now() + after;
    let timerListSingle = timerList[clamped_timeout];

    //如果当前时间不存在定时器链表，则new新的定时器链表
    if (!timerListSingle) {
        timerListSingle = new LinkList();
        timerList[clamped_timeout] = timerListSingle;
    }

    let timer = new Timer(callback, after, repeat);
    timerListSingle.append(timer);
    return timer;
}

//移除定时器
function removeTimer(timer) {
    LinkList.remove(timer);
}

module.exports = {addTimer, removeTimer};