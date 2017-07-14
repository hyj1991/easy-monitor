'use strict';
const fs = require('fs');
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

    //无需增加额外路由
    if (!config.http.prefix) return;

    /** 以下是针对配置单页路由后的文件重定向 **/
    const forwardList = [
        '/_coverpage.md',
        '/README.md',
        '/document/docsify.min.js',
        '/document/vue.css',
        '/document/fonts/css',
        '/document/fonts/toadOcfmlt9b38dHJxOBGCP2LEk6lMzYsRqr3dHFImA.woff2',
        '/document/fonts/ODelI1aHBYDBqgeIAH2zlJbPFduIYtoLzwST68uhz_Y.woff2',
        '/document/fonts/toadOcfmlt9b38dHJxOBGMzFoXZ-Kj537nB_-9jJhlA.woff2',
        '/document/fonts/hMqPNLsu_dywMa4C_DEpY4gp9Q8gbYrhqGlRav_IXfk.woff2'
    ];

    //设置路由
    forwardList.forEach(fd => {
        //进行初始化操作
        const ext = path.extname(fd);
        const extraPath = ext === '.md' && '/document/' || '';
        const filePath = config.dashboard.public || path.join(__dirname, `../../public${extraPath}${fd}`);
        //仅对 css 文件进行替换
        const fileContent = String(fs.readFileSync(filePath));
        const needReplace = ext === '.css' || !ext;
        const newFileContent = needReplace && fileContent.replace(/\/document\/fonts\//g, `${config.http.prefix}/document/fonts/`);

        //设置路由
        app.get(`${config.http.prefix}${fd}`, function (req, res, next) {
            needReplace ? res.end(newFileContent) : res.sendFile(config.dashboard.public || path.join(__dirname, `../../public${extraPath}${fd}`));
        });
    });
}