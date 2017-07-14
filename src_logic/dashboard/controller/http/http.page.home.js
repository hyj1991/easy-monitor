'use strict';
const path = require('path');

module.exports = function (app) {
    //取出公共对象
    const common = this.common;
    const config = this.config;
    const dbl = this.dbl;

    //客户端采用 Vue 编写的单页面应用，故而这些路由均需指向 index.ejs 文件
    app.get([
        `${config.http.prefix}/`,
        `${config.http.prefix}/${config.http.router.page_index}`,
        `${config.http.prefix}/${config.http.router.page_profiler}`,
        `${config.http.prefix}/${config.http.router.page_overview}`],
        (req, res, next) => res.render('index', { config: { prefix: config.http.prefix } }));

    /** 以下是针对配置单页路由后的静态资源文件重定向 **/
    const forwardList = ['/echarts2.min.js', '/dist/main.css', '/dist/vendors.js', '/dist/main.js'];
    forwardList.forEach(fd => {
        app.get(`${config.http.prefix}${fd}`, function (req, res, next) {
            res.sendFile(config.dashboard.public || path.join(__dirname, `../../public${fd}`));
        });
    });
}