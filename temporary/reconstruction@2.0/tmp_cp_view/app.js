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
const prettyBytes = require('pretty-bytes');
const gzipSize = require('gzip-size');
const compression = require('compression');
const mem_calculator = require('./mem_calculator.js');

function getAnalysis(heapData) {
    const { heapMap, leakPoint, statistics, rootIndex, aggregates } = analytic.memAnalytics(heapData);
    const heapUsed = leakPoint.reduce((pre, next) => {
        pre[next.index] = heapMap[next.index];
        return pre;
    }, {});
    //加入 root 节点信息
    heapUsed[rootIndex] = heapMap[rootIndex];

    const mem_data = mem_calculator(heapUsed, heapMap, leakPoint, rootIndex);
    const forceGraph = mem_data.forceGraph;
    const searchList = mem_data.searchList.map(item => item.index);

    return { heapUsed, leakPoint, statistics, rootIndex, aggregates, forceGraph, searchList }
}

function mbStringLength(s) {
    var totalLength = 0;
    var i;
    var charCode;
    for (i = 0; i < s.length; i++) {
        charCode = s.charCodeAt(i);
        if (charCode < 0x007f) {
            totalLength = totalLength + 1;
        } else if ((0x0080 <= charCode) && (charCode <= 0x07ff)) {
            totalLength += 2;
        } else if ((0x0800 <= charCode) && (charCode <= 0xffff)) {
            totalLength += 3;
        }
    }
    //alert(totalLength);
    return totalLength;
}

const r_error = getAnalysis(heapData_error);
const r_warning = getAnalysis(heapData_warning);
const r_healthy = getAnalysis(heapData_healthy);
//console.log(aggregates);

const profilerData = {};

app.set('views', path.join(__dirname, './view'));
app.set('view engine', 'ejs');

app.use(compression());
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

    const keyList = data.pidList.map(id => `${data.processName}_${data.serverName}_${id}_${data.opt}`);
    const notInitKeyList = keyList.filter(key => !profilerData[key]);

    notInitKeyList.forEach(key => {
        if (data.opt === 'cpu') {
            _cpuOperator(key);
        }

        if (data.opt === 'mem') {
            _memOpreator(key);
        }
    });

    res.send(JSON.stringify({ success: true, data: `${JSON.stringify(notInitKeyList)} task created!` }));

    function _memOpreator(key) {
        const pid = key.split("_")[2];

        //立即 初始化 memory 操作数据
        profilerData[key] = {
            done: false,
            results: mem.init(pid) || {}
        }

        //2s 后设置 profiling 结束
        setTimeout(() => {
            profilerData[key].results = mem.middle1(pid) || {};
        }, 1000);

        //5s 后设置 数据压缩上报 结束
        setTimeout(() => {
            profilerData[key].results = mem.middle2(pid) || {};
            if (Number(pid) === 51301) {
                profilerData[key].error = '当前进程没有获取到 Memory 数据，请稍后刷新页面再试...';
                clearTimeout(end_mem);
            }
        }, 2000);

        //7s 后设置 数据压缩上报 结束
        const end_mem = setTimeout(() => {
            const endData = mem.end(pid);
            const randomNum = Number(pid) % 3;
            endData.data = randomNum === 1 && r_healthy || randomNum === 2 && r_warning || r_error;
            profilerData[key].done = true;
            profilerData[key].results = endData;
            // profilerData[key].error = "";
        }, 3000);
    }


    function _cpuOperator(key) {
        const pid = key.split("_")[2];

        //立即 初始化 cpu 操作数据
        profilerData[key] = {
            done: false,
            results: cpu.init(pid) || {}
        }

        //3s 后设置 profiling 结束
        const middle_cpu = setTimeout(() => {
            profilerData[key].results = cpu.middle(pid) || {};
            if (Number(pid) === 51301) {
                profilerData[key].error = '当前进程没有获取到 CPU 数据，请稍后刷新页面再试...';
                clearTimeout(end_cpu);
            }
        }, 3000);

        //5s 后设置数据，模拟成功
        const end_cpu = setTimeout(() => {
            profilerData[key].done = true;
            profilerData[key].results = cpu.end(pid) || {};
            // profilerData[key].error = "当前进程没有获取到 CPU 数据，请稍后刷新页面再试...";
        }, 5000);
    }
});

//客户端定时向服务器查询数据
app.post('/axiosProfilerDetail', function axiosProfilerDetail(req, res, next) {
    const body = req.body && req.body.data || {};
    console.log('axiosProfilerDetail', JSON.stringify(body));
    const key = `${body.processName}_${body.serverName}_${body.pid}_${body.opt}`;

    if (!profilerData[key]) {
        res.send(JSON.stringify({ success: false, data: `${key} task do not exist!` }));
        return;
    }

    const data = profilerData[key];
    if (data.done === true && !data.set) {
        data.done = false;
        let loadingMsgTmp = data.results.loadingMsg;
        let dataTmp = data.results.data;
        let gzip = gzipSize.sync(JSON.stringify(data));
        data.results.loadingMsg = `分析数据准备完毕，大小为: ${prettyBytes(gzip)}，请耐心等待下载...`;
        data.results.data = null;
        setImmediate(() => {
            data.results.loadingMsg = loadingMsgTmp;
            data.results.data = dataTmp;
            data.done = true;
            //表示已经设置过一次了，无需再次设置
            data.set = true;
        });
    }
    res.send(JSON.stringify({ success: true, data: JSON.stringify(data) }));

    //获取一次成功数据后清空操作，此处逻辑可以定制
    if (profilerData[key].done || profilerData[key].error) {
        console.log(`[${moment().format('llll')}]`, `clear ${key}...`);
        profilerData[key] = null;
    }
});

app.listen(12334, () => console.log('server start at 12334...'));