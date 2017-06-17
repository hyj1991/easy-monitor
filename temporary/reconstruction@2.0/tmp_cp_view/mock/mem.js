function init_template(pid, need) {
    if (!need)
        return {
            "machineUnique": "huangyijun.local",
            "projectName": "Closure Leak",
            "processPid": pid,
            "done": false,
            "loadingMsg": "开始进行 Memory 数据采集...",
            "data": {}
        };
    else return null;
}

function middle1_template(pid, need) {
    if (!need)
        return {
            "machineUnique": "huangyijun.local",
            "projectName": "Closure Leak",
            "processPid": pid,
            "done": false,
            "loadingMsg": ["Memory 数据采集完毕, 当前采用上报模式, 开始进行数据压缩上传...", "我是1", "我是2", "我是3"],
            "data": {}
        };
    else return null;
}

function middle2_template(pid, need) {
    if (!need)
        return {
            "machineUnique": "huangyijun.local",
            "projectName": "Closure Leak",
            "processPid": pid,
            "done": false,
            "loadingMsg": "Memory 采集数据上传完毕, 开始进行数据解压分析...",
            "data": {}
        };
    else return null;
}

function end_template(pid, need) {
    if (!need)
        return {
            "machineUnique": "huangyijun.local",
            "projectName": "Closure Leak",
            "processPid": pid,
            "done": true,
            "loadingMsg": "Memory 采集数据分析完成！",
            "data": {}
        };
    else return null;
}

module.exports = {
    init: init_template,
    middle1: middle1_template,
    middle2: middle2_template,
    end: end_template
};