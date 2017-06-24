'use strict';

exports = module.exports = function (config) {
    return {
        auth: {
            //是否需要开启鉴权，默认是 false
            need: false,

            //是否允许修改
            need_disable: true,

            //设置具有所有权限的 admin 用户, 如果设置应当为 Array
            admin: false,

            //是否允许修改
            admin_disable: false,

            //根据项目进行分别的鉴权，仅在 admin: [xxx, xxx] 下生效
            project_auth: {},

            //是否允许修改
            project_auth_disable: false,

            //非 cluster 模式下的鉴权超时
            timeout: 3 * 1000,

            //需要对登录 user - project 之间映射关系进行鉴权校验的 url
            app_auth_path: [
                //通知开启进行 profilin 操作
                `${config.http.prefix}/${config.http.router.axios_profiler}`,
                //获取 profiling 详情
                `${config.http.prefix}/${config.http.router.axios_detail}`,
                //获取 os 概览信息
                `${config.http.prefix}/${config.http.router.axios_overview}`,
                //动态配置 config
                `${config.http.prefix}/${config.http.router.axios_fetch}`,
            ],

            /**
             * @param {string} user @param {string} passed
             * @return {promise}
             * @description 如果 need 为 true，需要开发者自己实现 authentication 方法
             */
            authentication(user, passed) {
                //正常情况下永远也不会走到这里！
                if (!config.auth || !config.auth.need) return Promise.resolve(true);
                //开发者未实现，直接抛出异常
                throw new Error('auth.need 为 true 时请实现自己的 authentication 方法!');
            }
        }
    }
}

//auth 配置文件必须在 http 配置文件加载之后被加载
exports.order = { bef: ['http'] }