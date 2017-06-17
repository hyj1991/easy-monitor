'use strict';
import echarts from 'echarts';

/**
 * @component: views/common/echart3.vue
 * @vue-data: methods
 * @descript: 使用 echart3 渲染图表
 */
function renderCharts() {
    const myChart = echarts.init(this.$refs.statistics);
    myChart.setOption(this.chartOption);
}


/**
 * @component: views/common/echart3.vue
 * @vue-data: computed
 * @descript: 设置渲染图表的数据信息
 */
function chartOption() {
    let option = {
        title: this.message.title,
        tooltip: this.message.tooltip,
        legend: this.message.legend,
        series: this.message.series
    };
    const statistics = this.data && this.data.statistics || {};
    option.legend.data = Object.keys(statistics).reduce((pre, next) => {
        if (next !== 'total' && next !== 'v8heap') {
            pre.push(next);
        }
        return pre;
    }, []);
    option.series[0].data = Object.keys(statistics).reduce((pre, next) => {
        if (next !== 'total' && next !== 'v8heap') {
            pre.push({ name: next, value: statistics[next] })
        }
        return pre;
    }, []);

    return option;
}

//导出 echart3.vue 所需
export default {
    methods: { renderCharts },
    computed: { chartOption }
}