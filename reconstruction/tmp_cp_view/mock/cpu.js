module.exports = {
    init: {
        "3233": {
            "machineUnique": "huangyijun.local",
            "projectName": "Closure Leak",
            "processPid": "3233",
            "loadingMsg": "开始进行 CPU 数据采集...",
            "data": {}
        },

        "3234": {
            "machineUnique": "huangyijun.local",
            "projectName": "Closure Leak",
            "processPid": "3234",
            "loadingMsg": "开始进行 CPU 数据采集...",
            "data": {}
        }
    },

    middle: {
        "3233": {
            "machineUnique": "huangyijun.local",
            "projectName": "Closure Leak",
            "processPid": "3233",
            "loadingMsg": "CPU 数据采集完毕, 开始进行分析...",
            "data": {}
        },
        "3234": {
            "machineUnique": "huangyijun.local",
            "projectName": "Closure Leak",
            "processPid": "3234",
            "loadingMsg": "CPU 数据采集完毕, 开始进行分析...",
            "data": {}
        }
    }

    ,
    end: {
        "3233": {
            "machineUnique": "huangyijun.local",
            "projectName": "Closure Leak",
            "processPid": "3233",
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

        "3234": {
            "machineUnique": "huangyijun.local",
            "projectName": "Closure Leak",
            "processPid": "3234",
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
    }
}