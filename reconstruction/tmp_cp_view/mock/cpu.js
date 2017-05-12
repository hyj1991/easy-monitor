module.exports = {
    init: [
        {
            "machineUnique": "huangyijun.local",
            "projectName": "Closure Leak",
            "processPid": "57128",
            "done": false,
            "loadingMsg": "开始进行 CPU 数据采集...",
            "data": {}
        },

        {
            "machineUnique": "huangyijun.local",
            "projectName": "Closure Leak",
            "processPid": "57129",
            "done": false,
            "loadingMsg": "开始进行 CPU 数据采集...",
            "data": {}
        }
    ],

    middle: [
        {
            "machineUnique": "huangyijun.local",
            "projectName": "Closure Leak",
            "processPid": "57128",
            "done": false,
            "loadingMsg": "CPU 数据采集完毕, 开始进行分析...",
            "data": {}
        },

        {
            "machineUnique": "huangyijun.local",
            "projectName": "Closure Leak",
            "processPid": "57129",
            "done": false,
            "loadingMsg": "CPU 数据采集完毕, 开始进行分析...",
            "data": {}
        }
    ],

    end: [
        {
            "machineUnique": "huangyijun.local",
            "projectName": "Closure Leak",
            "processPid": "57128",
            "done": true,
            //"error": "huangyijun.local 服务器发生内部错误！",
            "loadingMsg": "CPU 采集数据分析完成！",
            "data": {
                "timeout": 500,
                "longFunctions": [{
                    "type": "timeout",
                    "funcName": "tmpArr.forEach.item",
                    "execTime": 1.238,
                    "percentage": "100.00",
                    "url": "(/Users/huangyijun/git/easy-monitor/main_process/src/tcpclient.js 46)"
                },
                {
                    "type": "timeout",
                    "funcName": "doCpuProfiler",
                    "execTime": 1.238,
                    "percentage": "100.00",
                    "url": "(/Users/huangyijun/git/easy-monitor/main_process/src/cpuprofiler.js 8)"
                }],
                "topExecutingFunctions": [
                    {
                        "type": "timeout",
                        "funcName": "tmpArr.forEach.item",
                        "execTime": 1.238,
                        "percentage": "100.00",
                        "url": "(/Users/huangyijun/git/easy-monitor/main_process/src/tcpclient.js 46)"
                    },
                    {
                        "type": "timeout",
                        "funcName": "doCpuProfiler",
                        "execTime": 1.238,
                        "percentage": "100.00",
                        "url": "(/Users/huangyijun/git/easy-monitor/main_process/src/cpuprofiler.js 8)"
                    }
                ],
                "bailoutFunctions": []
            }
        },

        {
            "machineUnique": "huangyijun.local",
            "projectName": "Closure Leak",
            "processPid": "57129",
            "done": true,
            "loadingMsg": "CPU 采集数据分析完成！",
            "data": {
                "timeout": 500,
                "longFunctions": [{
                    "type": "timeout",
                    "funcName": "tmpArr.forEach.item",
                    "execTime": 1.238,
                    "percentage": "100.00",
                    "url": "(/Users/huangyijun/git/easy-monitor/main_process/src/tcpclient.js 46)"
                }],
                "topExecutingFunctions": [
                    {
                        "type": "timeout",
                        "funcName": "tmpArr.forEach.item",
                        "execTime": 1.238,
                        "percentage": "100.00",
                        "url": "(/Users/huangyijun/git/easy-monitor/main_process/src/tcpclient.js 46)"
                    },
                    {
                        "type": "timeout",
                        "funcName": "doCpuProfiler",
                        "execTime": 1.238,
                        "percentage": "100.00",
                        "url": "(/Users/huangyijun/git/easy-monitor/main_process/src/cpuprofiler.js 8)"
                    }
                ],
                "bailoutFunctions": []
            }
        }
    ]
}