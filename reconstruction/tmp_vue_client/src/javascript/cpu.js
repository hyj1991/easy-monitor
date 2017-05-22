'use strict';
import axios from 'axios';

/**
 * @component: views/common/profiler/cpu.vue
 * @vue-data: methods
 * @descript: 对时间 ms 进行格式化
 */
function formatTime(ts) {
    let str = '';
    if (ts < 1e3) {
        str = `${ts.toFixed(2)} ms`;
    } else if (ts < 1e6) {
        str = `${(ts / 1e3).toFixed(2)} s`;
    } else if (ts < 1e9) {
        str = `${(ts / 1e6).toFixed(2)} min`;
    } else if (ts < 1e12) {
        str = `${(ts / 1e9).toFixed(2)} h`;
    } else {
        str = `${ts.toFixed(2)} ms`;
    }

    return str;
}

/**
 * @component: views/common/profiler/cpu.vue
 * @vue-data: methods
 * @descript: 自定义 table 组件渲染
 */
function render(row, column, index) {
    const filePath = row.filePath;
    //use overflow-ivu-poptip-ivu-poptip-rel to ovewrite poptip style
    return `<div>
                <Tooltip trigger="hover" placement="top-start" class="overflow-ivu-poptip-ivu-poptip-rel">
                    <div style="text-overflow:ellipsis;white-space:nowrap;overflow:hidden;">
                        ${filePath}
                    </div>
                    <div slot="content">
                        ${filePath}
                    </div>
                </Tooltip>
            </div>`;
}

/**
 * @component: views/common/profiler/cpu.vue
 * @vue-data: methods
 * @descript: 检查数据获取状态
 */
function checkStat(data) {
    const vm = this;

    _send(data);
    this.checkStatTimer = setInterval(() => {
        //if has done, clear interval
        if (vm.axiosDone.profilerDetail) {
            return clearInterval(vm.checkStatTimer);
        }
        //if sended, do not sent
        if (vm.axiosSended) return;

        vm.axiosSended = true;
        _send(data);
    }, 1000);

    function _send(data) {
        axios
            .post(config.default.axiosPath.getProfilerDetail, { data })
            .then(response => {
                vm.axiosSended = false;
                const data = response && response.data || {};
                if (data.success && data.msg) {
                    const msg = JSON.parse(data.msg);
                    let axiosProfilerDetailDone = Boolean(msg.done);
                    if (msg.error) {
                        axiosProfilerDetailDone = true;
                        vm.error = msg.error;
                    }
                    vm.axiosDone.profilerDetail = axiosProfilerDetailDone;
                    vm.singleProfiler = msg.results;
                } else {
                    //const errorMsg = 'Server Inner Error, Please refresh this page!';
                    //vm.error = data.msg || errorMsg;
                    //clearInterval(vm.checkStatTimer);
                }
            })
            .catch(err => {
                const errorMsg = `${err}, Please refresh this page!`;
                vm.error = errorMsg;
                clearInterval(vm.checkStatTimer);
            });
    }
}

/**
 * @component: views/common/profiler/cpu.vue
 * @vue-data: computed
 * @descript: cpu 采集数据结果进行计算得到的概览值
 */
function singleProfilerData() {
    const data = this.singleProfiler && this.singleProfiler.data || {};
    const timeout = data.timeout || 200;
    const longFunctions = data.longFunctions || [];
    const topExecutingFunctions = data.topExecutingFunctions || [];
    const bailoutFunctions = data.bailoutFunctions || [];

    return { timeout, longFunctions, topExecutingFunctions, bailoutFunctions };
}

/**
 * @component: views/common/profiler/cpu.vue
 * @vue-data: computed
 * @descript: long / top / bailout 列表信息
 */
function listInfo() {
    const singleProfiler = this.singleProfiler || {};
    const singleProfilerData = this.singleProfilerData || {};

    const done = this.axiosDone.profilerDetail;
    const loadingMsg = singleProfiler.loadingMsg;
    const long = {
        timeout: singleProfilerData.timeout,
        number: singleProfilerData.longFunctions.length
    }
    const top = {
        number: singleProfilerData.topExecutingFunctions.length
    }
    const bail = {
        number: singleProfilerData.bailoutFunctions.length
    }

    const process = {
        pid: this.pid,
        href: `pid_${this.pid}`,
        machineUnique: `${singleProfiler.machineUnique}_${singleProfiler.projectName}_${this.pid}`
    }

    return { long, top, bail, process, done, loadingMsg };
}

/**
 * @component: views/common/profiler/cpu.vue
 * @vue-data: computed
 * @descript: 服务器错误信息
 */
function server_error() {
    return this.error || (this.singleProfiler && this.singleProfiler.error) || false;
}

/**
 * @component: views/common/profiler/cpu.vue
 * @vue-data: computed
 * @descript: long 数据信息
 */
function data_long() {
    return this.singleProfilerData.longFunctions.map(item => ({
        functionName: item.funcName,
        execTime: this.formatTime(item.execTime),
        execPercentage: item.percentage,
        filePath: item.url
    }));
}

/**
 * @component: views/common/profiler/cpu.vue
 * @vue-data: computed
 * @descript: top 数据信息
 */
function data_top() {
    return this.singleProfilerData.topExecutingFunctions.map(item => ({
        functionName: item.funcName,
        execTime: this.formatTime(item.execTime),
        execPercentage: item.percentage,
        filePath: item.url
    }));
}

/**
 * @component: views/common/profiler/cpu.vue
 * @vue-data: computed
 * @descript: bailout 数据信息
 */
function data_bail() {
    return this.singleProfilerData.bailoutFunctions.map(item => ({
        functionName: item.funcName,
        bailoutReason: item.bailoutReason,
        filePath: item.url
    }));
}


//导出 cpu.vue 所需
export default {
    methods: { formatTime, render, checkStat },
    computed: { singleProfilerData, listInfo, server_error, data_long, data_top, data_bail }
}