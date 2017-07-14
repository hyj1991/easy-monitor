'use strict';
const fs = require('fs');
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

    //无需增加额外路由
    if (!config.http.prefix) return;

    /** 以下是针对配置单页路由后的静态资源文件重定向 **/
    const forwardList = [
        '/echarts2.min.js',
        '/dist/main.css',
        '/dist/vendors.js',
        '/dist/main.js',
        '/dist/0.chunk.js',
        '/dist/1.chunk.js',
        '/dist/2.chunk.js',
        '/dist/2c2ae068be3b089e0a5b59abb1831550.eot',
        '/dist/05acfdb568b3df49ad31355b19495d4a.woff',
        '/dist/621bd386841f74e0053cb8e67f8a0604.svg',
        '/dist/24712f6c47821394fba7942fbb52c3b2.ttf'
    ];

    //设置路由
    forwardList.forEach(fd => {
        //进行初始化操作
        const filePath = config.dashboard.public || path.join(__dirname, `../../public${fd}`);
        const ext = path.extname(filePath);
        //仅对 js/css 文件进行替换
        const needReplace = Boolean(ext === '.js' || ext === '.css');
        const fileContent = String(fs.readFileSync(filePath));
        const newFileContent = needReplace && fileContent.replace(/\/dist\//g, `${config.http.prefix}/dist/`);

        //设置路由
        app.get(`${config.http.prefix}${fd}`, function (req, res, next) {
            needReplace ? res.end(newFileContent) : res.sendFile(config.dashboard.public || path.join(__dirname, `../../public${fd}`));
        });
    });
}