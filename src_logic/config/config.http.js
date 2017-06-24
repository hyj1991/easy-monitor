'use strict';

exports = module.exports = {
    //定义 http 请求错误码与文字详情
    http: {
        //http 路由前缀
        prefix: '',

        //http 超时时间
        timeout: 3 * 1000,

        router: {
            //以下是 axios 请求路径
            axios_config: 'axiosConfig',
            axios_detail: 'axiosProfilerDetail',
            axios_index: 'axiosIndexPage',
            axios_overview: 'axiosOverview',
            axios_profiler: 'axiosProfiler',
            axios_fetch: 'axiosFetchConfig',

            //以下是 page 页面请求路径
            page_document: 'document',
            page_index: 'index',
            page_profiler: 'profiler',
            page_overview: 'overview'
        },

        //以下定义的是错误码
        "0": "成功!",
        "1": "body 不能为空!",
        "2": "请求进程不存在!",
        "3": "服务器内部错误!",
        "4": "业务进程不存在!",
        "5": "未获取到 OS 信息数据!",
        "6": "鉴权失败!",
        "7": function (msg) {
            msg = typeof msg === 'object' && msg || { user: msg };
            return `用户 ${msg.user || '未知'} 对此项目无操作权限!`
        }
    }
}