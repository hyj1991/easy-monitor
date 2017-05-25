'use strict';

module.exports = function (app) {
    //取出公共对象
    const common = this.common;
    const config = this.config;
    const dbl = this.dbl;

    /**
     * @description 用于处理获取首页 project - server - list 信息
     */
    function axiosIndex(req, res, next) {
        res.send(JSON.stringify({
            success: true,
            data: {
                seg: config.seg,
                projectPidMap: {
                    "Mercury#-#huangyijun.local": {
                        "list": [
                            "51301",
                            "51302",
                            "51303"
                        ],
                        "loading": 0
                    }
                }
            }
        }));
    }

    //以下是此 controller 文件注册的路由
    app.post('/axiosIndexPage', axiosIndex);
}