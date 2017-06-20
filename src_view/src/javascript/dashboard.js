'use strict';
import axios from 'axios';
import router from '../main.js';

/**
 * @component: views/common/overview/dashboard.vue
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
 * @component: views/common/overview/dashboard.vue
 * @vue-data: methods
 * @descript: 获取指定进程的相关信息
 */
function fetchOverview() {
    const vm = this;
    const rawParams = vm.rawParams;
    const data = {
        name: rawParams.processName,
        server: rawParams.serverName,
        pid: vm.pid,
        opt: rawParams.opt,
    }
    //首次请求
    _send(data);

    vm.axiosTimer = setInterval(() => {
        //尚未返回，不发送
        if (vm.axiosSended) return;
        //置为发送状态
        vm.axiosSended = true;
        //发送数据
        _send(data);
    }, 1000);

    //发起请求
    function _send(data) {
        axios.post(`${config.default.axiosPath.getOverview}?name=${data.name}`, { data }).then(response => {
            vm.axiosSended = false;
            const data = response.data;
            if (data.success) {
                let overview = data.data || '{}';
                overview = JSON.parse(overview);
                vm.firstDone = true;
                vm.cpuDetail = overview.cpu;
                vm.memDetail = overview.mem;
            } else {
                if (Number(data.code) === 4) {
                    router.push({ path: config.default.vueRouter.index });
                    clearInterval(vm.axiosTimer);
                }

                if (Number(data.code) === 7) {
                    vm.$Message.error('当前用户对此项目无操作权限，如有疑问请联系管理员!');
                    router.push({ path: config.default.vueRouter.index });
                    clearInterval(vm.axiosTimer);
                }
            }
        }).catch(err => {
            const errorMsg = `${err}, Please refresh this page!`;
            vm.error = errorMsg;
            clearInterval(vm.axiosTimer);
        });
    }
}

/**
 * @component: views/common/overview/dashboard.vue
 * @vue-data: computed
 * @descript: 进程相关信息
 */
function process() {
    const rawParams = this.rawParams || {};

    return {
        pid: this.pid,
        href: `pid_${this.pid}`,
        loadingMsg: `加载服务器概览信息...`
    }
}

/**
 * @component: views/common/overview/dashboard.vue
 * @vue-data: computed
 * @descript: 计算当前使用中 cpu 时间片比率
 */
function totalUsage() {
    const cpuDetail = this.cpuDetail;
    //没有数据直接返回
    if (!cpuDetail) return {
        percentage: 0,
        color: this.circle_color.healthy
    };
    //有数据则进行计算
    const rawPercentage = (1 - cpuDetail.idle) * 100;
    const percentage = Number(rawPercentage.toFixed(2));
    const color = percentage <= 33 && this.circle_color.healthy || percentage <= 66 && this.circle_color.warning || this.circle_color.error;

    return { percentage, color, rawPercentage };
}

/**
 * @component: views/common/overview/dashboard.vue
 * @vue-data: computed
 * @descript: 计算当前使用中的 memory 占用信息
 * @open-source: 此处 vue-charts 展示灵感来源于 Memeye 项目，感谢作者的开源精神
 * @open-source-address：项目原地址：https://github.com/JerryC8080/Memeye
 */
let fn = null;
function chartData(init) {
    //清除缓存
    if (init) return fn = null;

    const vm = this;
    //柯里化函数
    if (!fn) fn = (function () {
        //设置间隔 100 
        const records = 120;

        //动态图表数据缓存
        const dynamicData = {
            labels: new Array(records),
            rssData: new Array(records),
            heapTotalData: new Array(records),
            heapUsedData: new Array(records),
        }

        //真正每次执行的函数
        return function () {
            const memoryUsage = vm.memDetail;
            //计算得出 rss 数据
            dynamicData.rssData.shift();
            dynamicData.rssData.push(memoryUsage.rss / 1024 / 1024);
            //计算得出 heapTotal 数据
            dynamicData.heapTotalData.shift();
            dynamicData.heapTotalData.push(memoryUsage.heapTotal / 1024 / 1024);
            //计算得出 heapUsed 数据
            dynamicData.heapUsedData.shift();
            dynamicData.heapUsedData.push(memoryUsage.heapUsed / 1024 / 1024);

            return {
                labels: dynamicData.labels,
                datasets: [
                    {
                        label: 'heapUsed',
                        pointStyle: 'line',
                        // fill: false,
                        borderColor: "rgba(255, 99, 132, 0.8)",
                        backgroundColor: 'rgba(255, 99, 132, 0.3)',
                        data: dynamicData.heapUsedData,
                    },
                    {
                        label: 'heapTotal',
                        pointStyle: 'line',
                        // fill: false,
                        borderColor: "rgba(54, 162, 235, 0.8)",
                        backgroundColor: 'rgba(54, 162, 235, 0.3)',
                        data: dynamicData.heapTotalData,
                    },
                    {
                        label: 'rss',
                        pointStyle: 'line',
                        // fill: false,
                        borderColor: "rgba(53, 221, 101, 0.8)",
                        backgroundColor: 'rgba(53, 221, 101, 0.3)',
                        data: dynamicData.rssData,
                    },
                ]
            };
        }
    })();

    return fn();
}

//导出 dashboard.vue 所需
export default {
    methods: { fetchOverview, formatSize },
    computed: { process, totalUsage, chartData }
}