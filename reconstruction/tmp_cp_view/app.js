'use strict';
const path = require('path');
const express = require('express');
const app = express();
const mock = require('./mock/mock.json');

app.set('views', path.join(__dirname, './view'));
app.set('view engine', 'ejs');

app.use(express.static(path.join(__dirname, '../tmp_vue_client')));

app.get('/', function index(req, res, next) {
    const json = { data: mock.indexPage };

    res.render('index', json);
});

app.get('/axiosIndexPage', function axiosIndexPage(req, res, next) {
    const json = { data: mock.indexPage };

    res.send(JSON.stringify(json));
});

app.listen(12334);