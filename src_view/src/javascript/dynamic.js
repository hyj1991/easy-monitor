'use strict';
import axios from 'axios';

/**
 * @component: views/common/dynamic.vue
 * @vue-data: methods
 * @descript: 对项目配置文件进行操作：获取、更新
 */
function fetchConfig(data, cb) {
    //初始化参数
    const vm = this;
    //获取类型
    const type = data.type;

    //内部方法，计算 logger 对应的字符串
    function _getLogger(level) {
        if (isNaN(level)) return level;

        let str = '';
        switch (Number(level)) {
            case 0:
                str = 'error';
                break;
            case 1:
                str = 'warn';
                break;
            case 2:
                str = 'info';
                break;
            case 3:
                str = 'debug';
                break;
        }

        return str;
    }

    axios.post(`${config.default.axiosPath.fetchConfig}?name=${this.name}`, { data })
        .then(response => {
            const data = response.data;
            if (data.success) {
                vm.done = true;
                //获取配置相关
                if (type === 'get') {
                    const msg = JSON.parse(data.data);
                    vm.user = msg.user;

                    //取出 mode 相关
                    const mode = msg.mode || {};
                    vm.runMode = mode.cluster;
                    vm.runModeDisable = mode.disable;

                    //取出 logger 相关
                    const logger = msg.logger || {};
                    vm.logLevel = _getLogger(logger.log_level);
                    vm.loggerDisable = logger.disable;

                    //取出分析采集数据相关
                    const profiler = msg.profiler || {};
                    vm.cpas = Boolean(Number(profiler.mode) === 1);
                    vm.cpasDisable = profiler.modeDisable;

                    //取出 cpu 相关
                    const cpu = msg.cpu || {};
                    vm.cpuFilter = Boolean(cpu.need_filter);
                    vm.cpuFilterDisable = cpu.disable.filter;
                    vm.cpuProfiler = isNaN(cpu.profiling_time) && 1 || Number(cpu.profiling_time / 1000);
                    vm.cpuProfilerDisable = cpu.disable.profiler;
                    vm.cpuTimeout = isNaN(cpu.timeout) && 1 || Number(cpu.timeout);
                    vm.cpuTimeoutDisable = cpu.disable.timeout;
                    vm.cpuLong = isNaN(cpu.long_limit) && 1 || Number(cpu.long_limit);
                    vm.cpuLongDisable = cpu.disable.long;
                    vm.cpuTop = isNaN(cpu.top_limit) && 1 || Number(cpu.top_limit);
                    vm.cpuTopDisable = cpu.disable.top;
                    vm.cpuBailout = isNaN(cpu.bail_limit) && 1 || Number(cpu.bail_limit);
                    vm.cpuBailoutDisable = cpu.disable.bail;

                    //取出 mem 相关
                    const memory = msg.memory || {};
                    vm.memStream = Boolean(!memory.not_stream);
                    vm.memStreamDisable = memory.disable.stream;
                    vm.memRoot = Boolean(memory.need_root);
                    vm.memRootDisable = memory.disable.root;
                    vm.memLeakLimit = isNaN(memory.leakpoint_limit) && 1 || Number(memory.leakpoint_limit);
                    vm.memLeakLimitDisable = memory.disable.leakpoint;
                    vm.memChildren = isNaN(memory.node_limit) && 1 || Number(memory.node_limit);
                    vm.memChildrenDisable = memory.disable.children;
                    vm.memRootDistance = isNaN(memory.distance_root_limit) && 1 || Number(memory.distance_root_limit);
                    vm.memRootDistanceDisable = memory.disable.rootd;
                    vm.memLeakDistance = isNaN(memory.distance_limit) && 1 || Number(memory.distance_limit);
                    vm.memLeakDistanceDisable = memory.disable.regulard;

                    //取出 auth 相关
                    const auth = msg.auth || {};
                    vm.authNeed = Boolean(auth.need);
                    vm.authNeedDisable = auth.disable.need;
                    vm.adminList = Array.isArray(auth.admin) && auth.admin || [];
                    vm.normalList = Array.isArray(auth.project_auth) && auth.project_auth || [];
                }

                if (type === 'modify') cb && cb(null);
            } else {
                vm.error = data.error || '未知错误';
                console.error('dynamic.js', data.error);
                if (type === 'modify') cb && cb(vm.error);
            }
        })
        .catch(e => {
            const errorMsg = `${e}, Please refresh this page!`;
            console.error('dynamic.js', errorMsg);
            vm.error = errorMsg;
            if (type === 'modify') cb && cb(vm.error);
        });
}

/**
 * @component: views/common/dynamic.vue
 * @vue-data: methods
 * @descript: 初始化掉一些脏数据
 */
function initDynamic() {
    this.error = null;
    // this.done = false;
}

/**
 * @component: views/common/dynamic.vue
 * @vue-data: methods
 * @descript: 监听到变更时发送对配置文件的操作请求
 */
function axiosFetch(type, cb) {
    //get 数据
    if (type === "get") {
        const data = { type: 'get', name: this.name };
        this.done = false;
        //获取数据前更新 done 状态
        this.done = false;
        //获取配置
        fetchConfig.call(this, data);
    }

    //submit 数据
    if (type === "submit") {
        const data = { type: 'modify', name: this.name };
        //设置修改后的 logger 配置
        data.logger = this.logLevel !== '' && { log_level: this.logLevel };

        //设置修改后的分析数据采集模式配置
        data.profiler = { mode: this.cpas && 1 || 0 };

        //设置修改后的 cpu 配置
        data.cpu = {
            need_filter: this.cpuFilter,
            profiling_time: this.cpuProfiler * 1000,
            timeout: this.cpuTimeout,
            long_limit: this.cpuLong,
            top_limit: this.cpuTop,
            bail_limit: this.cpuBailout
        }

        //设置修改后的 memory 配置
        data.memory = {
            need_root: this.memRoot,
            leakpoint_limit: this.memLeakLimit,
            node_limit: this.memChildren,
            distance_root_limit: this.memRootDistance,
            distance_limit: this.memLeakDistance
        }

        //设置修改后的 auth 配置
        data.auth = {
            admin: this.adminList,
            project_auth: this.normalList
        }

        //发送修改的数据
        fetchConfig.call(this, data, cb);
    }
}

/**
 * @component: views/common/dynamic.vue
 * @vue-data: methods
 * @descript: 处理删除列表事件
 */
function closeList(type, event, name) {
    if (type === 'admin') {
        const adminList = this.adminList;
        const deleteIndex = adminList.indexOf(name);
        if (~deleteIndex) adminList.splice(deleteIndex, 1);
    }

    if (type === 'normal') {
        const normalList = this.normalList;
        const deleteIndex = normalList.indexOf(name);
        if (~deleteIndex) normalList.splice(deleteIndex, 1);
    }
}

/**
 * @component: views/common/dynamic.vue
 * @vue-data: methods
 * @descript: 处理增加列表事件
 */
function addList(type) {
    if (type === 'admin') {
        const newAdmin = this.inputAdmin;
        //不存在才增加
        if (!~this.adminList.indexOf(newAdmin) && newAdmin) this.adminList.push(newAdmin);
        //重置输入框内容
        this.inputAdmin = '';
        //关闭气泡框
        this.adminVisiable = false;
    }

    if (type === 'normal') {
        const newNormal = this.inputNormal;
        //不存在才增加
        if (!~this.normalList.indexOf(newNormal) && newNormal) this.normalList.push(newNormal);
        //重置输入框内容
        this.inputNormal = '';
        //关闭气泡框
        this.normalVisiable = false;
    }
}

/**
 * @component: views/common/dynamic.vue
 * @vue-data: methods
 * @descript: 气泡消失时清空 input
 */
function popperHidden(type) {
    if (type === 'admin') {
        this.inputAdmin = '';
    }

    if (type === 'normal') {
        this.inputNormal = '';
    }
}

/**
 * @component: views/common/dynamic.v¬ue
 * @vue-data: computed
 * @descript: 计算 loadingMsg 的值
 */
function loadingMsg() {
    return `获取项目 ${this.name} 配置中...`;
}

/**
 * @component: views/common/dynamic.v¬ue
 * @vue-data: computed
 * @descript: 判断当前登录用户是不是 admin 用户
 */
function isAdmin() {
    if (!this.user) return false;

    return Boolean(~this.adminList.indexOf(this.user));
}

//导出 dynamic.vue 所需
export default {
    methods: { initDynamic, fetchConfig, axiosFetch, closeList, addList, popperHidden },
    computed: { loadingMsg, isAdmin }
}