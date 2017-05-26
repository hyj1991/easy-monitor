'use strict';

exports = module.exports = {
    message: {
        /**
         * @description 定义所有请求类型, 原则为偶数
         */
        request: {
            "0": "HEART_BEAT_REQUEST"
        },

        /**
         * @description 定义所有响应类型，原则为奇数
         */
        response: {
            "1": "HEART_BEAT_RESPONSE"
        },

        /** 
         * @description 不存在的消息类型 
        */
        not_exist: "NOT_EXIST"
    }
}