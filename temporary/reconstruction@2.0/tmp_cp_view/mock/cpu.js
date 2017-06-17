const init_template = function (pid, need) {
    if (!need)
        return {
            "machineUnique": "huangyijun.local",
            "projectName": "Closure Leak",
            "processPid": pid,
            "loadingMsg": "开始进行 CPU 数据采集...",
            "data": {}
        };
    else return null;
}

const middle_template = function (pid, need) {
    if (!need)
        return {
            "machineUnique": "huangyijun.local",
            "projectName": "Closure Leak",
            "processPid": pid,
            "loadingMsg": "CPU 数据采集完毕, 开始进行分析...",
            "data": {}
        };
    else return null;
}

const end_template = function (pid, longFunctions, topExecutingFunctions, bailoutFunctions, need) {
    if (!need)
        return {
            "machineUnique": "huangyijun.local",
            "projectName": "Closure Leak",
            "processPid": pid,
            //"error": "huangyijun.local 服务器发生内部错误！",
            "loadingMsg": "CPU 采集数据分析完成！",
            "data": {
                "timeout": 500,
                "longFunctions": longFunctions || [{
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
                "topExecutingFunctions": topExecutingFunctions || [
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
                "bailoutFunctions": bailoutFunctions || []
            }
        };
    else return null;
}

module.exports = {
    init: init_template,
    middle: middle_template,
    end: end_template
}