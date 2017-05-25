'use strict';
import axios from 'axios';

/**
 * @component: views/common/profiler/mem.vue
 * @vue-data: methods
 * @descript: 格式化百分数
 */
function formatPercentage(num, limit = 2) {
    return Number(Number(num * 100).toFixed(limit));
}

/**
 * @component: views/common/profiler/mem.vue
 * @vue-data: methods
 * @descript: 格式化内存占用大小
 */
function formatSize(size) {
    let str = '';
    if (size / 1024 < 1) {
        str = `${(size).toFixed(2)} Bytes`;
    } else if (size / 1024 / 1024 < 1) {
        str = `${(size / 1024).toFixed(2)} KB`;
    } else if (size / 1024 / 1024 / 1024 < 1) {
        str = `${(size / 1024 / 1024).toFixed(2)} MB`;
    } else {
        str = `${(size / 1024 / 1024 / 1024).toFixed(2)} GB`;
    }

    return str;
}

/**
 * @component: views/common/profiler/mem.vue
 * @vue-data: methods
 * @descript: 按照大小字符串进行自定义排序
 */
function sortBySize(o, n, t) {
    if (~o.indexOf("GB")) {
        o = o.slice(0, o.indexOf("GB") - 1) * 1024 * 1024 * 1024;
    } else if (~o.indexOf("MB")) {
        o = o.slice(0, o.indexOf("MB") - 1) * 1024 * 1024;
    } else if (~o.indexOf("KB")) {
        o = o.slice(0, o.indexOf("KB") - 1) * 1024;
    } else if (~o.indexOf("Bytes")) {
        o = o.slice(0, o.indexOf("Bytes") - 1);
    }

    if (~n.indexOf("GB")) {
        n = n.slice(0, n.indexOf("GB") - 1) * 1024 * 1024 * 1024;
    } else if (~n.indexOf("MB")) {
        n = n.slice(0, n.indexOf("MB") - 1) * 1024 * 1024;
    } else if (~n.indexOf("KB")) {
        n = n.slice(0, n.indexOf("KB") - 1) * 1024;
    } else if (~n.indexOf("Bytes")) {
        n = n.slice(0, n.indexOf("Bytes") - 1);
    }

    o = Number(o);
    n = Number(n);

    if (t === 'desc') return o < n ? 1 : -1;
    if (t === 'asc') return o < n ? -1 : 1;
}

/**
 * @component: views/common/profiler/mem.vue
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
 * @component: views/common/profiler/mem.vue
 * @vue-data: methods
 * @descript: 按照类型分类 modal 弹窗
 */
function typeHandle() {
    this.type = true;
}

/**
 * @component: views/common/profiler/mem.vue
 * @vue-data: methods
 * @descript: 按照构造器分类 modal 弹窗
 */
function constructorHandle() {
    this.constructor = true;
}

/**
 * @component: views/common/profiler/mem.vue
 * @vue-data: methods
 * @descript: 选中某一个 id 的节点进行引力图追踪详情
 */
function selectHandle(id) {
    this.modal_node_id = id;
    this.force = true;
}

/**
 * @component: views/common/profiler/mem.vue
 * @vue-data: methods
 * @descript: 疑似泄漏点的引力图追踪详情
 */
function leakHandle(id) {
    this.modal_node_id = id;
    this.force = true;
}

/**
 * @component: views/common/profiler/mem.vue
 * @vue-data: computed
 * @descript: 获取当前 memory 采集数据分析结果
 */
function singleProfilerData() {
    const data = this.singleProfiler && this.singleProfiler.data || {};
    const heapUsed = data.heapUsed || {};
    const statistics = data.statistics || {};
    const leakPoint = data.leakPoint || [];
    const rootIndex = data.rootIndex || 0;
    const aggregates = data.aggregates || [];
    const searchList = data.searchList || [];
    const forceGraph = data.forceGraph || {};

    //compute maxRetainedSize percentage
    const maxRetainedSize = leakPoint[0] && heapUsed[leakPoint[0].index].retainedSize || 0;
    const maxRetainedPercentage = statistics.total && this.formatPercentage(maxRetainedSize / statistics.total) || 0;
    const maxRetainedStatus = maxRetainedPercentage < 30 && 1 || maxRetainedPercentage < 60 && 2 || 3;
    const maxRetainedStatusString = maxRetainedStatus === 1 && '良好' || maxRetainedStatus === 2 && '风险' || '泄露';
    const maxRetainedColor = maxRetainedStatus === 1 && this.circle_color.healthy || maxRetainedStatus === 2 && this.circle_color.warning || this.circle_color.leaking;
    const maxRetainedString = maxRetainedPercentage <= 0 && '暂无信息' || `${maxRetainedPercentage} %`;
    const maxRetainedInfo = {
        percentage: maxRetainedPercentage,
        color: maxRetainedColor,
        string: maxRetainedString,
        status: maxRetainedStatusString
    }

    this.process_status = maxRetainedStatus;
    return { maxRetainedInfo, statistics, leakPoint, heapUsed, rootIndex, aggregates, forceGraph, searchList };
}

/**
 * @component: views/common/profiler/mem.vue
 * @vue-data: computed
 * @descript: 根据 axios 获取的数据，得到 loadingMsg 和是否完成信息
 */
function listInfo() {
    const singleProfiler = this.singleProfiler || {};
    const singleProfilerData = this.singleProfilerData || {};

    const done = this.axiosDone.profilerDetail;
    const loadingMsg = singleProfiler.loadingMsg;

    const process = {
        pid: singleProfiler.processPid,
        href: `pid_${singleProfiler.processPid}`,
        machineUnique: singleProfiler.machineUnique
    }

    return { done, loadingMsg, process };
}

/**
 * @component: views/common/profiler/mem.vue
 * @vue-data: computed
 * @descript: 服务器错误信息
 */
function server_error() {
    return this.error || (this.singleProfiler && this.singleProfiler.error) || false;
}

/**
 * @component: views/common/profiler/mem.vue
 * @vue-data: computed
 * @descript: memory 采集数据分析后得到的概览信息（按照构造器分类）
 */
function statistics() {
    const statistics = this.singleProfilerData && this.singleProfilerData.statistics || {};
    const total = statistics.total || 0;
    const v8heap = statistics.v8heap || 0;
    const native = statistics.native || 0;
    const code = statistics.code || 0;
    const jsArrays = statistics.jsArrays || 0;
    const strings = statistics.strings || 0;
    const system = statistics.system || 0;
    return {
        statistics, total, v8heap, native, code, jsArrays, strings, system,
        totalString: this.formatSize(total),
        v8heapString: this.formatSize(v8heap),
        nativeString: this.formatSize(native),
        codeString: this.formatSize(code),
        jsArraysString: this.formatSize(jsArrays),
        stringsString: this.formatSize(strings),
        systemString: this.formatSize(system)
    }
}

/**
 * @component: views/common/profiler/mem.vue
 * @vue-data: computed
 * @descript: 疑似泄漏内存点展示
 */
function leakPoint() {
    const leakPoint = this.singleProfilerData && this.singleProfilerData.leakPoint || [];
    const heapUsed = this.singleProfilerData.heapUsed;
    return leakPoint.reduce((pre, next) => {
        const detail = heapUsed[next.index] || { retainedSize: 0 };
        const percentage = this.statistics.total && this.formatPercentage(detail.retainedSize / this.statistics.total) || 0;
        const status = percentage < 60 && 2 || 3;
        const type = status === 2 && 'warning' || 'error';
        const name = `${detail.name}::${detail.id}`;
        const id = detail.id;
        pre.push({ type, name, id });
        return pre;
    }, []).filter((item, index) => index < 5);
}

/**
 * @component: views/common/profiler/mem.vue
 * @vue-data: computed
 * @descript: 展示所有允许用户查询的节点列表
 */
function idList() {
    const singleProfilerData = this.singleProfilerData || {};
    const heapUsed = singleProfilerData.heapUsed || {};
    const indexList = singleProfilerData.searchList || [];
    indexList.sort((o, n) => Number(heapUsed[o].distance) < Number(heapUsed[n].distance) ? -1 : 1);
    return indexList.map(item => {
        const detail = heapUsed[item] || {};
        const data = `${detail.name}::${detail.id}`;
        return {
            value: data,
            label: data
        };
    });
}

/**
 * @component: views/common/profiler/mem.vue
 * @vue-data: computed
 * @descript: 根据构造器分类详情列表
 */
function dataConstructor() {
    const singleProfilerData = this.singleProfilerData || {};
    const aggregates = singleProfilerData.aggregates || [];
    return Object.keys(aggregates).map(constructor => {
        const type = aggregates[constructor].type;
        const distance = aggregates[constructor].distance;
        const object_count = aggregates[constructor].count;
        const shallow_size = this.formatSize(aggregates[constructor].self);
        const retained_size = this.formatSize(aggregates[constructor].maxRet);

        return { constructor, type, distance, object_count, shallow_size, retained_size };
    });
}

/**
 * @component: views/common/profiler/mem.vue
 * @vue-data: computed
 * @descript: 使用 echart3 展示按照类型分类详情
 */
function echart3Message() {
    return {
        title: {
            text: `Pid:${this.pid}`,
            subtext: 'HeapSnapshot Statistics',
            x: 'center'
        },
        tooltip: {
            trigger: 'item',
            formatter: "{a} <br/>{b} : {c} ({d}%)"
        },
        legend: {
            orient: 'vertical',
            left: 'left',
            data: []
        },
        series: [
            {
                name: 'HeapSnapshot',
                type: 'pie',
                radius: '55%',
                center: ['50%', '60%'],
                data: [],
                itemStyle: {
                    emphasis: {
                        shadowBlur: 10,
                        shadowOffsetX: 0,
                        shadowColor: 'rgba(0, 0, 0, 0.5)'
                    }
                }
            }
        ]
    }
}

/**
 * @component: views/common/profiler/mem.vue
 * @vue-data: computed
 * @descript: 获取服务器相关的引力图数据信息
 */
function forceGraphLeakPoint() {
    const all = this.singleProfilerData.forceGraph;
    const leakGraph = all[this.modal_node_id];
    return leakGraph;
}


//导出 mem.vue 所需
export default {
    methods: {
        formatPercentage, formatSize, sortBySize, checkStat,
        typeHandle, constructorHandle, selectHandle, leakHandle
    },
    computed: {
        singleProfilerData, listInfo, server_error, statistics,
        leakPoint, idList, dataConstructor, echart3Message, forceGraphLeakPoint
    }
}