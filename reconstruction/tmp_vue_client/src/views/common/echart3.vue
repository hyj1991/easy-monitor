<style scoped lang="less">
</style>

<template>
    <div class="index" ref="statistics" :style="self_style || default_style"></div>
</template>

<script>
import echarts from 'echarts';

export default {
    data() {
        return {
            default_style: "width:600px;height:400px;"
        }
    },

    mounted() {
        this.renderCharts();
    },

    props: ['self_style' , 'data', 'message'],

    methods: {
        renderCharts() {
            const myChart = echarts.init(this.$refs.statistics);
            myChart.setOption(this.chartOption);
        }
    },

    computed: {
        chartOption() {
            let option = {
                    title: this.message.title,
                    tooltip: this.message.tooltip,
                    legend: this.message.legend,
                    series: this.message.series
                };
            const statistics = this.data && this.data.statistics || {};
            option.legend.data = Object.keys(statistics).reduce((pre, next)=> {
                if (next !== 'total' && next !== 'v8heap') {
                    pre.push(next);
                }
                return pre;
            }, []);
            option.series[0].data = Object.keys(statistics).reduce((pre, next) => {
                if (next !== 'total' && next !== 'v8heap') {
                    pre.push({name: next, value: statistics[next]})
                }
                return pre;
            }, []);

            return option;
        }
    },

    watch: {
        data() {
            //if data changed, re-render eachrt3
            this.renderCharts();
        }
    }
}
</script>