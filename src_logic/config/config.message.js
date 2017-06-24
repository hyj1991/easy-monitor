'use strict';

exports = module.exports = {
    message: {
        /**
         * @description 定义所有请求类型, 原则为偶数
         */
        request: {
            //心跳请求
            "0": "HEART_BEAT_REQUEST",
            //profiling 开始请求
            "2": "START_PROFILING_REQUEST",
            //profiling 过程中状态上报请求
            "4": "PROFILING_STATES_REQUEST",
            //os 信息获取请求
            "6": "OVERVIEW_UPLOAD_REQUEST",
            //鉴权请求
            "8": "AUTHENTICTION_REQUEST",
            //操作项目配置请求
            "10": "FETCH_CONFIG_REQUEST"
        },

        /**
         * @description 定义所有响应类型，原则为奇数
         */
        response: {
            //心跳响应
            "1": "HEART_BEAT_RESPONSE",
            //profiling 开始响应
            "3": "START_PROFILING_RESPONSE",
            //profiling 过程中状态上报响应
            "5": "PROFILING_STATES_RESPONSE",
            //os 信息获取响应
            "7": "OVERVIEW_UPLOAD_RESPONSE",
            //鉴权响应
            "9": "AUTHENTICTION_RESPONSE",
            //操作项目配置响应
            "11": "FETCH_CONFIG_RESPONSE"
        },

        /**
         * @description 定义所有非传向客户端的类型，单独计数
         */
        other: {
            "1": "NOTIFY_UPDATE_CONFIG"
        },

        /** 
         * @description 不存在的消息类型 
        */
        not_exist: "NOT_EXIST"
    }
}