'use strict';
const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const mock = require('./mock/mock.json');
const cpu = require('./mock/cpu.js');
const _ = require('lodash');

const profilerData = {};

app.set('views', path.join(__dirname, './view'));
app.set('view engine', 'ejs');

app.use(express.static(path.join(__dirname, '../tmp_vue_client')));
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: false, limit: '10mb' }));

app.all('*', function preCheck(req, res, next) {
    console.log('Go to', req.path);
    next();
});

app.get('/index', function index(req, res, next) {
    console.log(`Request On...`);
    const json = { data: mock.indexPage };

    res.render('index', json);
});

app.post('/axiosIndexPage', function axiosIndexPage(req, res, next) {
    const json = { data: mock.indexPage };

    res.send(JSON.stringify(json));
});

app.post('/axiosProfiler', function axiosProfiler(req, res, next) {
    const body = req.body;
    const data = body && body.data;
    if (!data) res.send(JSON.stringify({ success: false, msg: 'body can not be empty!' }));

    const key = `${body.processName}_${body.pid}_${body.opt}`;
    if (profilerData[key]) {
        res.send(JSON.stringify({ success: true, msg: `${key} already exist!` }));
        return
    }

    profilerData[key] = {
        done: false,
        results: cpu.init,
        error: null
    }

    //3s 后设置 profiling 结束
    setTimeout(()=>{
        profilerData[key].results = cpu.middle;
    }, 3000);

    //5s 后设置数据，模拟成功
    setTimeout(()=>{
        profilerData[key].done = true;
        profilerData[key].results = cpu.end;
    }, 5000);

    res.send(JSON.stringify({ success: true, msg: `${key} task created!` }));
});

app.post('/axiosProfilerDetail', function axiosProfilerDetail(req, res, next) {
    const body = req.body;
    const key = `${body.processName}_${body.pid}_${body.opt}`;

    if (!profilerData[key]) {
        res.send(JSON.stringify({ success: false, msg: `${key} task do not exist!` }));
        return;
    }

    res.send(JSON.stringify({success: true, msg: JSON.stringify(profilerData[key])}));

    //获取一次成功数据后清空操作
    if (profilerData[key].done){
        profilerData[key] = null;
    }
});

app.listen(12334);