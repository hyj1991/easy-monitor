'use strict';
import axios from 'axios';

/**
 * @component: views/profiler.vue
 * @vue-data: methods
 * @descript: 通知服务器开始进行对应操作数据采集
 */
function startProfiling(data, tag) {
    data.tag = tag;
    axios.post(config.default.axiosPath.startProfiler, { data })
        .then(response => { response.data })
        .catch(err => console.error(err));
}

/**
 * @component: views/profiler.vue
 * @vue-data: computed
 * @descript: 得到当前项目名称
 */
function processName() {
    return this.params.processName;
}

/**
 * @component: views/profiler.vue
 * @vue-data: computed
 * @descript: 得到当前项目在选择服务器上的 pid 列表
 */
function pidList() {
    let pidList = [];
    if (this.params && this.params.pidList && Array.isArray(this.params.pidList)) {
        pidList = this.params.pidList;
    }

    return pidList;
}

/**
 * @component: views/profiler.vue
 * @vue-data: computed
 * @descript: 悬浮导航栏信息，快速跳转到对应的进程
 */
function profilerComputed() {
    return this.pidList.map(item => {
        const tmp = {};
        tmp.navi = `Pid-${item}`;
        tmp.href = `pid_${item}`;
        return tmp;
    });
}


//导出 profiler.vue 所需
export default {
    methods: { startProfiling },
    computed: { processName, pidList, profilerComputed }
}