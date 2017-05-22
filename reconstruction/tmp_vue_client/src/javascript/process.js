'use strict';
import axios from 'axios';
import router from '../main.js';

/**
 * @component: views/common/process.vue
 * @vue-data: methods
 * @descript: 选择信息完成后，跳转到对应的处理页面
 * @ext: 如果 loadingTime 有值，则相应延时后再跳转
 */
function radioHandle() {
    const vm = this;
    const data = {
        processName: vm.processName,
        serverName: vm.serverName,
        pid: vm.e_pid,
        opt: vm.e_opt,
        tag: 'process.vue'
    }

    if (data.pid === 'all') {
        data.pidList = this.pidList;
    } else {
        data.pidList = [data.pid];
    }

    //通知服务器开始进行 cpu/memory 数据采集
    axios.post(config.default.axiosPath.startProfiler, { data })
        .then(response => { })
        .catch(err => console.error(err));

    //如果没有设置 loadingTime，则立即进行跳转
    if (!this.loadingTime) {
        router.push({
            path: `profiler`,
            query: data
        });
        return;
    }

    //如果设置了 loadingTime，则进行异步跳转
    this.loading = true;
    this.$Message.success(`will do ${this.e_opt} profiling`);
    setTimeout(() => {
        vm.loading = false;
        router.push({
            path: `profiler`,
            query: data
        });
    }, this.loadingTime);
}


function selectHandle(data) {
    this.pidList = this.singleProjectInfo[data] || [];
}

/**
 * @component: views/common/process.vue
 * @vue-data: computed
 * @descript: 服务器名称信息
 */
function serverName() {
    return this.server;
}

/**
 * @component: views/common/process.vue
 * @vue-data: computed
 * @descript: 服务器列表信息
 */
function serverList() {
    const serverList = this.singleProjectInfo.serverList;
    const results = serverList.map(item => ({
        label: item,
        value: item
    }));
    this.server = results[0].label;

    return results;
}

/**
 * @component: views/common/process.vue
 * @vue-data: computed
 * @descript: 项目名称信息
 */
function processName() {
    if (!this.singleProjectInfo || !this.singleProjectInfo.projectName) { return 'No Project'; }
    return this.singleProjectInfo.projectName;
}

/**
 * @component: views/common/process.vue
 * @vue-data: computed
 * @descript: project - server，对应的进程列表信息
 */
function processList() {
    return this.pidList.reduce((pre, next) => {
        pre.push({ type: 'ios-pulse', pid: next, label: next });
        return pre;
    }, [{ type: 'ios-browsers-outline', pid: 'All', label: 'all' }]);
}

/**
 * @component: views/common/process.vue
 * @vue-data: computed
 * @descript: 是否允许 start 按钮开启
 */
function disabled() {
    if (!Array.isArray(this.pidList)) return true;
    if (this.pidList.length === 0) return true;
    //TODO, if project has only one server, don't permit do all memory profiling
    //if(this.e_opt === 'mem' && this.e_pid === 'all' && this.serverList.length < 2 && this.processList.length != 2) return true;

    return false;
}

/**
 * @component: views/common/process.vue
 * @vue-data: computed
 * @descript: start 按钮是否需要异步跳转
 */
function loadingTime() {
    const singleProjectInfo = this.singleProjectInfo;
    if (singleProjectInfo && singleProjectInfo.loadingTime) {
        return singleProjectInfo.loadingTime;
    }

    return false;
}

//导出 process.vue 所需
export default {
    methods: { radioHandle, selectHandle },
    computed: { serverName, serverList, processName, processList, disabled, loadingTime }
}