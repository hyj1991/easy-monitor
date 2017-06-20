<style scoped lang="less">
</style>

<template>
    <div class="index">
        <Row type="flex" justify="center" class="code-row-bg">
            <!-- 渲染 overview 数据信息组件标题: pid -->
            <Col span=16 style="text-align:center" :id="process.href">
                <h2>PID-{{ pid }}</h2>
            </Col>
            <br>

            <!-- 渲染 overview 数据信息组件内容 -->
            <Col span=16>
                <Card>
                    <!-- memory 数据采集尚未结束，或者出现服务器错误，则展示 -->
                    <loading-spin v-if="error || !firstDone" 
                                  :loadingMsg="process.loadingMsg"
                                  :error="error">
                    </loading-spin>

                    <!-- 数据请求结束，并且没有错误，则展示对应的信息 -->
                    <div style="text-align:center" v-if="!error && firstDone">
                        <!-- 展示当前进程 cpu 占用率详情 -->
                        <Row type="flex" justify="center" class="code-row-bg">
                            <Col span=12>
                                <header class="header">
                                    <span>当前 CPU 使用率</span>
                                </header>
                            </Col>
                        </Row>
                        <Row type="flex" justify="center" class="code-row-bg">
                            <Col span=22>
                                <i-circle :size="150" :trail-width="2" :stroke-width="3"
                                      :percent="totalUsage.percentage" 
                                      :stroke-color="totalUsage.color">
                                    <div class="i-circle-custom">
                                        <!-- max retained-size node -->
                                        <p style="font-size:15px"><a :style="{color: totalUsage.color}">{{ totalUsage.percentage }}%</a></p>                                
                                    </div>
                                </i-circle>
                            </Col>
                        </Row>

                        <!-- 展示当前进程 mem 占用大小详情 -->
                        <Row type="flex" justify="center" class="code-row-bg">
                            <Col span=12>
                                <header class="header">
                                    <span>当前 Memory 占用</span>
                                </header>
                            </Col>
                        </Row>
                        <Row type="flex" justify="center" class="code-row-bg">
                            <Col span=14>
                                <line-chart :chart-data="chartData" :width="400"  :height="200" :formatSize="formatSize"></line-chart>
                            </Col>
                        </Row>
                    </div>
                </Card>
            </Col>  
        </Row>
        <br>
    </div>
</template>

<script>
import loadingSpin from '../loading.vue';
import { Line, mixins } from 'vue-chartjs'
const { reactiveProp } = mixins
//引入 vue-charts 的表格
const lineChart = Line.extend({
    mixins: [reactiveProp],
    props: ['formatSize'],
    mounted() {
        const vm = this;
        vm.renderChart(vm.chartData, {
            tooltips: { callbacks: { label: item=> vm.formatSize(Number(item.yLabel * 1024 * 1024)) } },
            animation: false
        })
    }
});

export default {
    data(){
        return { 
            cpuUsage: null, memoryUsage: null, cpuDetail: null,
            memDetail: null, error: null, firstDone: false, axiosSended: true, axiosTimer: null, 
            circle_color: { healthy: '#5cb85c', warning: '#ff9900', error: '#ff3300' }
        }
    },

    created() { 
        //向服务器拉取数据
        this.$_js.dashboard.methods.fetchOverview.call(this);
    },

    //钩子
    beforeDestroy(data) {
        //destroy interval
        this.axiosTimer && clearInterval(this.axiosTimer);
        //destroy closure
        this.$_js.dashboard.computed.chartData(true);
    },

    props: ['pid', 'rawParams'],

    components: { loadingSpin, lineChart },

    methods: { formatSize(size) { return this.$_js.dashboard.methods.formatSize(size); } },

    computed:{
        process() { return this.$_js.dashboard.computed.process.call(this); },
        totalUsage() { return this.$_js.dashboard.computed.totalUsage.call(this); },
        chartData() { return this.$_js.dashboard.computed.chartData.call(this); }
    }
}    
</script>