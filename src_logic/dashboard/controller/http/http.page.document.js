'use strict';
const path = require('path');

module.exports = function (app) {
    //取出公共对象
    const common = this.common;
    const config = this.config;
    const dbl = this.dbl;

    //客户端采用 Vue 编写的单页面应用，故而这些路由均需指向 index.ejs 文件
    app.get(`${config.http.prefix}/${config.http.router.page_document}`, function (req, res, next) {
        res.render('document', { config: { prefix: config.http.prefix } });
    });

    /** 以下是针对配置单页路由后的文件重定向 **/
    //获取封面
    app.get(`${config.http.prefix}/_coverpage.md`, function (req, res, next) {
        res.sendFile(config.dashboard.public || path.join(__dirname, '../../public/document/_coverpage.md'));
    });
    //获取内容
    app.get(`${config.http.prefix}/README.md`, function (req, res, next) {
        res.sendFile(config.dashboard.public || path.join(__dirname, '../../public/document/README.md'));
    });
}