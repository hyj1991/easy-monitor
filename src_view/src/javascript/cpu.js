'use strict';
import axios from 'axios';
import router from '../main.js';

/**
 * @component: views/common/profiler/cpu.vue
 * @vue-data: methods
 * @descript: 对时间进行自定义排序
 */
function sortByTime(o, n, t) {
    if (~o.indexOf(' s')) {
        o = Number(o.slice(0, o.indexOf(' s'))) * 1000;
    } else if (~o.indexOf(' min')) {
        o = Number(o.slice(0, o.indexOf(' min'))) * 1000 * 60;
    } else if (~o.indexOf(' h')) {
        o = Number(o.slice(0, o.indexOf(' h'))) * 1000 * 60 * 60;
    } else if (~o.indexOf(' ms')) {
        o = Number(o.slice(0, o.indexOf(' ms')));
    }

    if (~n.indexOf(' s')) {
        n = Number(n.slice(0, n.indexOf(' s'))) * 1000;
    } else if (~n.indexOf(' min')) {
        n = Number(n.slice(0, n.indexOf(' min'))) * 1000 * 60;
    } else if (~n.indexOf(' h')) {
        n = Number(n.slice(0, n.indexOf(' h'))) * 1000 * 60 * 60;
    } else if (~n.indexOf(' ms')) {
        n = Number(n.slice(0, n.indexOf(' ms')));
    }

    o = Number(o);
    n = Number(n);

    if (t === 'desc') return o < n ? 1 : -1;
    if (t === 'asc') return o < n ? -1 : 1;
}

/**
 * @component: views/common/profiler/cpu.vue
 * @vue-data: methods
 * @descript: 对时间 ms 进行格式化
 */
function formatTime(ts) {
    ts = !isNaN(ts) && ts || 0;
    let str = '';
    if (ts < 1e3) {
        str = `${ts.toFixed(2)} ms`;
    } else if (ts < 1e3 * 60) {
        str = `${(ts / 1e3).toFixed(2)} s`;
    } else if (ts < 1e3 * 60 * 60) {
        str = `${(ts / (1e3 * 60)).toFixed(2)} min`;
    } else if (ts < 1e3 * 60 * 60 * 60) {
        str = `${(ts / (1e3 * 60 * 60)).toFixed(2)} h`;
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
        data.sequence = vm.sequence;
        _send(data);
    }, 1000);

    function _send(data) {
        axios
            .post(`${config.default.axiosPath.getProfilerDetail}?name=${data.processName}`, { data })
            .then(response => {
                vm.axiosSended = false;
                const data = response && response.data || {};
                if (data.success && data.data) {
                    const msg = JSON.parse(data.data);
                    let axiosProfilerDetailDone = Boolean(msg.done);
                    if (msg.error) {
                        axiosProfilerDetailDone = true;
                        vm.error = msg.error;
                    }
                    vm.axiosDone.profilerDetail = axiosProfilerDetailDone;
                    vm.singleProfiler = msg.results;
                    vm.sequence = msg.results && msg.results.sequence || 0;
                } else {
                    // const errorMsg = 'Server Inner Error, Please refresh this page!';
                    // vm.error = data.error || errorMsg;
                    // clearInterval(vm.checkStatTimer);
                    if (Number(data.code) === 4) {
                        router.push({ path: config.default.vueRouter.index });
                        clearInterval(vm.checkStatTimer);
                    }

                    if (Number(data.code) === 7) {
                        // vm.$Message.error('当前用户对此项目无操作权限，如有疑问请联系管理员!');
                        router.push({ path: config.default.vueRouter.index });
                        clearInterval(vm.checkStatTimer);
                    }
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
    const flamegraphData = data.flamegraphData || {};

    return { timeout, longFunctions, topExecutingFunctions, bailoutFunctions, flamegraphData };
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
        parent: item.parent,
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
        execTimeAll: this.formatTime(item.execTimeAll),
        parent: item.parent,
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

/**
 * @component: views/common/profiler/cpu.vues
 * @descript: data change
 */
function doTransform() {
    this.$data.showBigPic = !this.$data.showBigPic
}

/**
 * @component: views/common/profiler/cpu.vue
 * @vue-data: methods
 * @descript: hide mask
 */
function hideMask() {
    this.$data.showBigPic = false;
    this.$data.flag = false
    this.$data.transformX = 0;
    this.$data.transformY = 0;
    document.querySelector('#drag').style.transform = 'translate(0px, 0px)';
}

/**
 * @component: views/common/profiler/cpu.vue
 * @vue-data: methods
 * @descript: onDragDown
 */
function eidtClient(e) {
    if (this.$data.showBigPic) {
        this.$data.flag = true;
        this.$data.currentX = e.clientX;
        this.$data.currentY = e.clientY;
        e.preventDefault();
    }
}

/**
 * @component: views/common/profiler/cpu.vue
 * @vue-data: methods
 * @descript: onDragUp
 */
function recordPosition() {
    if (this.$data.showBigPic) {
        this.$data.flag = false;
        let str = document.querySelector('#drag').style.transform;
        let xyPos = str.match(/(\-)?\d+/g);
        if (!xyPos) {
            xyPos = [0, 0]
        }
        [this.$data.transformX, this.$data.transformY] = xyPos;
    }
}

/**
 * @component: views/common/profiler/cpu.vue
 * @vue-data: methods
 * @descript: onDragMove
 */
function onDrag(e) {
    if (this.$data.showBigPic && this.$data.flag) {
        var disX = Number(this.$data.transformX) + Number(e.clientX) - Number(this.$data.currentX);
        var disY = Number(this.$data.transformY) + Number(e.clientY) - Number(this.$data.currentY);

        document.querySelector('#drag').style.transform = `translate(${disX}px, ${disY}px)`
    }
}

//导出 cpu.vue 所需
export default {
    methods: { sortByTime, formatTime, render, checkStat, doTransform, hideMask, eidtClient, recordPosition, onDrag },
    computed: { singleProfilerData, listInfo, server_error, data_long, data_top, data_bail }
}