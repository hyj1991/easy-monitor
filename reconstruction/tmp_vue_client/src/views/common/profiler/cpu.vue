<style scoped lang="less">
    .index {
        h2 {
            font-size: 3em;
        }
    }    
</style>
<style>
    .overflow-ivu-poptip-ivu-poptip-rel {}

    .overflow-ivu-poptip-ivu-poptip-rel.ivu-tooltip, .overflow-ivu-poptip-ivu-poptip-rel .ivu-tooltip-rel {
        display: block;
    }
    .overflow-ivu-poptip-ivu-poptip-rel .ivu-tooltip-inner {
        max-width: none;
    }
</style>

<template>
<div>
    <Row type="flex" justify="center" class="code-row-bg">
        <!-- 渲染 cpu 数据信息组件标题: pid -->
        <Col span=16 style="text-align:center" :id="listInfo.process.href">
            <h2>PID-{{ pid }}</h2>
        </Col>
        <br>

        <!-- 渲染 cpu 数据信息组件内容 -->
        <Col span=16>
            <Card>
                <!-- loading 界面，出现条件: 1. 出现服务器错误 2. 数据请求还未结束 -->
                <loading-spin v-if="server_error || !listInfo.done" 
                              :loadingMsg="listInfo.loadingMsg"
                              :error="server_error">
                </loading-spin>

                <!-- 数据请求结束，并且没有错误，则展示对应的信息 -->
                <div style="text-align:center" v-if="!server_error && listInfo.done">
                    <!-- 展示执行时长超过你预设的值的函数列表，默认为 500ms -->
                    <Row type="flex" justify="center" class="code-row-bg">
                        <Col span=12>
                            <header class="header">
                                <span>执行大于 {{ listInfo.long.timeout }}ms 的函数</span>
                            </header>
                        </Col>
                    </Row>
                    <Row type="flex" justify="center" class="code-row-bg">
                        <Col span=22>
                            <Table border :columns="columns_long" :data="data_long"></Table>
                        </Col>
                    </Row>
                    <br>
                    
                    <!-- 展示耗费最久的函数列表 -->
                    <Row type="flex" justify="center" class="code-row-bg">
                        <Col span=12>
                            <header class="header">
                                <span>耗费最久的 {{ listInfo.top.number }} 个函数</span>
                            </header>
                        </Col>
                    </Row>
                    <Row type="flex" justify="center" class="code-row-bg">
                        <Col span=22>   
                            <Table border :columns="columns_top" :data="data_top"></Table>
                        </Col>
                    </Row>
                    <br>
                    
                    <!-- 展示引擎逆优化最频繁的函数列表 -->
                    <Row type="flex" justify="center" class="code-row-bg">
                        <Col span=12>
                            <header class="header">
                                <span>引擎逆优化最频繁的 {{ listInfo.bail.number }} 个函数</span>
                            </header>
                        </Col>
                    </Row>
                    <Row type="flex" justify="center" class="code-row-bg">
                        <Col span=22>
                            <Table border :columns="columns_bail" :data="data_bail"></Table>
                        </Col>
                    </Row>
                    <br>
                </div>
            </Card>
        </Col>  
    </Row>
    <br>

</div>
</template>

<script> 
    import axios from 'axios';
    import lodash from 'lodash';
    import loadingSpin from '../loading.vue';

    export default {
        data() {
            return {                
                singleProfiler: null, error: null, checkStatTimer: null,
                axiosDone: { profilerDetail: false }, axiosSended: false,
                columns_long: [
                    { title: '函数名称', key: 'functionName', align: 'center' },
                    { title: '执行时长', key: 'execTime', align: 'center' },
                    { title: '占据调用者百分比', key: 'execPercentage', align: 'center' },
                    { title: '系统路径', key: 'filePath', align: 'center', render: this.render }
                ],
                columns_top: [
                    { title: '函数名称', key: 'functionName', align: 'center' },
                    { title: '执行时长', key: 'execTime', align: 'center' },
                    { title: '占据调用者百分比', key: 'execPercentage', align: 'center' },
                    { title: '系统路径', key: 'filePath', align: 'center', render: this.render }
                ],
                columns_bail: [
                    { title: '函数名称', key: 'functionName', align: 'center' },
                    { title: '逆优化原因', key: 'bailoutReason', align: 'center' },
                    { title: '系统路径', key: 'filePath', align: 'center', render: this.render }
                ]
            }
        }, 

        created() {
            const data = lodash.merge({}, this.rawParams, {pid: this.pid});
            this.startProfiling(data, 'cpu.vue');
            this.checkStat(data);
        },

        //hook
        beforeDestroy() {
            //destroy interval
            this.checkStatTimer && clearInterval(this.checkStatTimer);
        },

        props: ['pid', 'rawParams', 'startProfiling'],

        components: { loadingSpin },

        methods: {
            checkStat(data) { this.$_js.cpu.methods.checkStat.call(this, data); },
            formatTime(ts) { return this.$_js.cpu.methods.formatTime.call(this, ts); },            
            render (row, column, index) { return this.$_js.cpu.methods.render.apply(this, [row, column, index]); }
        },

        computed: {
            listInfo() { return this.$_js.cpu.computed.listInfo.call(this); },
            server_error() { return this.$_js.cpu.computed.server_error.call(this); },
            data_long() { return this.$_js.cpu.computed.data_long.call(this); },
            data_top() { return this.$_js.cpu.computed.data_top.call(this); },
            data_bail() { return this.$_js.cpu.computed.data_bail.call(this); },
            singleProfilerData() { return this.$_js.cpu.computed.singleProfilerData.call(this); }            
        }
    }
</script>