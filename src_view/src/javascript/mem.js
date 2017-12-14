'use strict';
import axios from 'axios';
import router from '../main.js';

/**
 * @param {string} query @param {number} limit
 * @description 内部方法，根据过滤条件进行过滤
 */
function innerCalculate(query, limit) {
    limit = !isNaN(limit) && limit || 20;
    const leakPoint = this.singleProfilerData && this.singleProfilerData.leakPoint || [];
    const singleProfilerData = this.singleProfilerData || {};
    const heapUsed = singleProfilerData.heapUsed || {};

    const list = Object.keys(heapUsed);
    const result = { length: 0, result: [] };

    /**
     * @param {string} str
     * @description 将字符串转换成大写
     */
    function _upper(str) {
        return String(str).toUpperCase();
    }

    /**
     * @param {string} str
     * @description 将字符串转换成小写
     */
    function _lower(str) {
        return String(str).toLowerCase();
    }

    for (let i = 0, l = list.length; i < l; i++) {
        if (result.length > limit) break;

        const detail = heapUsed[list[i]] || {};
        if (Number(list[i]) === 0) detail.name = 'Root';
        const key = `${detail.realId} => ${detail.name}::@${detail.address}${~leakPoint.indexOf(detail.realId) && `(force: ${formatSize(detail.retainedSize)})` || ``}`;
        if (~_upper(key).indexOf(_upper(query)) || ~_lower(key).indexOf(_lower(query))) {
            result.result.push({ value: key, label: key });
            result.length++;
        }
    }

    if (result.result.length === 0) result.result.push({ value: 'No Data', label: 'No Data' });
    return result.result;
}

/**
 * @component: views/common/profiler/mem.vue
 * @vue-data: methods
 * @descript: tree modal 框关闭时的回调，清除默认设置以便于下次点击
 */
function treeCancel() {
    this.node_id = '';
}

/**
 * @component: views/common/profiler/mem.vue
 * @vue-data: methods
 * @descript: 动态计算节点展示结果
 */
function remoteMethod(query) {
    const vm = this;
    vm.remoteLoading = true;
    const result = innerCalculate.call(this, query);
    vm.remoteLoading = false;

    this.idListCalculate = result;
}

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
    if (!id) return;

    const nodeDetail = id.split(' => ');
    //获取 index 和组装原始的 key
    const index = nodeDetail[0];
    const extraIndex = nodeDetail[1].indexOf(' (force:');
    const tree_id = nodeDetail[1] && ~extraIndex && nodeDetail[1].slice(0, extraIndex) || nodeDetail[1];
    //打开树节点
    this.tree_id = tree_id;
    this.tree = true;

    //获取该根节点信息
    const singleProfilerData = this.singleProfilerData || {};
    const heapUsed = singleProfilerData.heapUsed || {};
    const detail = heapUsed[index];

    //预留 children 占位
    this.tree_data = [{
        index: index,
        title: `<p style="font-size:1.0em"><strong>${tree_id}</strong>  (type: ${detail.type}, size: ${formatSize(detail.retainedSize)})</p>`,
        children: [{ fake: true }]
    }];
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
 * @vue-data: methods
 * @descript: tree 节点被点击时触发
 */
function onTreeSelect(obj) {
    const index = obj.index;
    const singleProfilerData = this.singleProfilerData || {};
    const heapUsed = singleProfilerData.heapUsed || {};
    //获取节点详情
    const nodeDetail = heapUsed[index] || { children: [] };
    const children = obj.children;
    //设置异常下的默认数据
    const exception = { title: `<p style="font-size:1.0em;color:#b3b3b3"><i>暂无该节点数据</i></p>`, disabled: true };

    //如果子节点是占位，则替换成真正的子节点数据
    if (children.length === 1 && children[0].fake) {
        obj.children = nodeDetail.edges.map(item => {
            const cIndex = item.realId;
            const cDetail = heapUsed[cIndex];
            //节点不存在则直接返回
            if (!cDetail) return exception;

            //以下是需要判断的变量
            let disabled = false;
            let name = cDetail.name;
            if (name.length > 100) {
                name = name.substring(0, 100);
            }
            let title = `<p style="font-size:1.0em"><strong>.${item.edge}</strong> => <strong>${name}::${cDetail.address}</strong>  (type: ${cDetail.type}, size: ${formatSize(cDetail.retainedSize)})</p>`

            //判断该节点是否循环
            let parent = obj;
            while (!disabled && parent) {
                if (Number(cIndex) === Number(parent.index)) {
                    disabled = true;
                    title = `<p style="font-size:1.0em;color:#b3b3b3"><strong>.${item.edge}</strong> => <strong>${name}::${cDetail.address}</strong>  (type: ${cDetail.type}, size: ${formatSize(cDetail.retainedSize)})</p>`
                };
                parent = parent.parent;
            }

            return {
                parent: obj,
                disabled,
                index: cIndex,
                title,
                children: [{ fake: true }]
            }
        });

        //预留占位
        if (obj.children.length === 0) {
            obj.children = [exception];
        }
    }
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
    const leakMaps = data.leakMaps || [];

    //compute maxRetainedSize percentage
    const maxRetainedSize = leakPoint[0] && heapUsed[leakPoint[0]].retainedSize || 0;
    const maxRetainedPercentage = statistics.total && this.formatPercentage(maxRetainedSize / statistics.total) || 0;
    const maxRetainedStatus = maxRetainedPercentage < 20 && 1 || maxRetainedPercentage < 60 && 2 || 3;
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
    return { maxRetainedInfo, statistics, leakPoint, heapUsed, rootIndex, aggregates, forceGraph, searchList, leakMaps };
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
        const detail = heapUsed[next] || { retainedSize: 0 };
        const percentage = this.statistics.total && this.formatPercentage(detail.retainedSize / this.statistics.total) || 0;
        const status = percentage < 60 && 2 || 3;
        const type = status === 2 && 'warning' || 'error';
        const name = `${detail.name}::@${detail.address}`;
        const id = detail.address;
        pre.push({ type, name, id });
        return pre;
    }, []);
}

/**
 * @component: views/common/profiler/mem.vue
 * @vue-data: computed
 * @descript: 展示所有允许用户查询的节点列表
 */
function idList() {
    const idListCalculate = this.idListCalculate;
    if (idListCalculate.length) return this.idListCalculate;

    //否则返回初始化数据
    return innerCalculate.call(this, '', 10);
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

/**
 * @component: views/common/profiler/mem.vue
 * @vue-data: computed
 * @descript: 获取引力图关系列表
 */
function links() {
    const leakMaps = this.singleProfilerData.leakMaps;
    return leakMaps && leakMaps[this.modal_node_id] || '';
}

/**
 * @component: views/common/profiler/mem.vue
 * @vue-data: computed
 * @descript: 获取引力图
 */
function leakTitle() {
    const singleProfilerData = this.singleProfilerData || {};
    const heapUsed = singleProfilerData.heapUsed || {};
    const leakPoint = singleProfilerData.leakPoint || [];
    const nodeDetail = heapUsed[leakPoint[this.modal_node_id]];
    return nodeDetail && `[${nodeDetail.name}::@${nodeDetail.address}: ${this.formatSize(nodeDetail.retainedSize)}]` || ``;
}

//导出 mem.vue 所需
export default {
    methods: {
        remoteMethod, treeCancel,
        formatPercentage, formatSize, sortBySize, checkStat,
        typeHandle, constructorHandle, selectHandle, leakHandle, onTreeSelect
    },
    computed: {
        singleProfilerData, listInfo, server_error, statistics, links, leakTitle,
        leakPoint, idList, dataConstructor, echart3Message, forceGraphLeakPoint
    }
}