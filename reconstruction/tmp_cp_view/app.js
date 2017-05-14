'use strict';
const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const analytic = require('v8-analytics');
const app = express();
const mock = require('./mock/mock.json');
const cpu = require('./mock/cpu.js');
const mem = require('./mock/mem.js');
const heapData_error = require('./mock/mem_error.json').heapData;
const heapData_warning = require('./mock/mem_warning.json').heapData;
const heapData_healthy = require('./mock/mem_healthy.json').heapData;
const _ = require('lodash');
const moment = require('moment');

function getAnalysis(heapData) {
    const { heapMap, leakPoint, statistics, rootIndex, aggregates } = analytic.memAnalytics(heapData);
    const heapUsed = leakPoint.reduce((pre, next) => {
        pre[next.index] = heapMap[next.index];
        return pre;
    }, {});
    //加入 root 节点信息
    heapUsed[rootIndex] = heapMap[rootIndex];

    return { heapUsed, leakPoint, statistics, rootIndex, aggregates }
}

const r_error = getAnalysis(heapData_error);
const r_warning = getAnalysis(heapData_warning);
const r_healthy = getAnalysis(heapData_healthy);
//console.log(aggregates);

const profilerData = {};

app.set('views', path.join(__dirname, './view'));
app.set('view engine', 'ejs');

app.use(express.static(path.join(__dirname, './public')));
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: false, limit: '10mb' }));

app.all('*', function preCheck(req, res, next) {
    console.log('Go to', req.path, req.method);
    next();
});

app.get(['/', '/index', '/profiler'], function index(req, res, next) {
    console.log(`Request On...`);
    const json = { data: mock.indexPage };

    res.render('index', json);
});

//获取首页信息
app.post('/axiosIndexPage', function axiosIndexPage(req, res, next) {
    const json = { data: mock.indexPage };

    res.send(JSON.stringify(json));
});

//触发服务器开始采集 CPU/MEM 数据
app.post('/axiosProfiler', function axiosProfiler(req, res, next) {
    const body = req.body;
    const data = body && body.data;
    console.log('axiosProfiler', JSON.stringify(data));
    if (!data) res.send(JSON.stringify({ success: false, msg: 'body can not be empty!' }));

    const key = `${data.processName}_${data.serverName}_${data.pid}_${data.opt}`;
    if (profilerData[key]) {
        res.send(JSON.stringify({ success: true, msg: `${key} already exist!` }));
        return;
    }

    if (data.opt === 'cpu') {
        _cpuOperator();
    }

    if (data.opt === 'mem') {
        _memOpreator();
    }

    res.send(JSON.stringify({ success: true, msg: `${key} task created!` }));


    function _memOpreator() {
        //立即 初始化 memory 操作数据
        profilerData[key] = {
            done: false,
            results: mem.init,
            error: null
        }

        //2s 后设置 profiling 结束
        setTimeout(() => {
            profilerData[key].results = mem.middle1;
        }, 2000);

        //5s 后设置 数据压缩上报 结束
        setTimeout(() => {
            profilerData[key].results = mem.middle2;
        }, 4000);

        //7s 后设置 数据压缩上报 结束
        setTimeout(() => {
            mem.end[0].data = r_warning;
            mem.end[1].data = r_error;
            mem.end[2].data = r_healthy;
            profilerData[key].done = true;
            profilerData[key].results = mem.end;
        }, 6000);
    }


    function _cpuOperator() {
        //立即 初始化 cpu 操作数据
        profilerData[key] = {
            done: false,
            results: cpu.init,
            error: null
        }

        //3s 后设置 profiling 结束
        setTimeout(() => {
            profilerData[key].results = cpu.middle;
        }, 3000);

        //5s 后设置数据，模拟成功
        setTimeout(() => {
            profilerData[key].done = true;
            profilerData[key].results = cpu.end;
        }, 5000);
    }
});

//客户端定时向服务器查询数据
app.post('/axiosProfilerDetail', function axiosProfilerDetail(req, res, next) {
    const body = req.body && req.body.data || {};
    console.log('axiosProfilerDetail', JSON.stringify(body));
    const key = `${body.processName}_${body.serverName}_${body.pid}_${body.opt}`;

    if (!profilerData[key]) {
        res.send(JSON.stringify({ success: false, msg: `${key} task do not exist!` }));
        return;
    }

    res.send(JSON.stringify({ success: true, msg: JSON.stringify(profilerData[key]) }));

    //获取一次成功数据后清空操作，此处逻辑可以定制
    if (profilerData[key].done) {
        console.log(`[${moment().format('llll')}]`, `clear ${key}...`);
        profilerData[key] = null;
    }
});

app.listen(12334);