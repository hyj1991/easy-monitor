<style scoped lang="less">
    .index {
        h2 {
            font-size: 3em;
        }
    }
    .w-flamegraph-change{
        position: fixed;
        z-index: 200;
    }
    .mask{
        position:fixed;
        width: 100%;
        height: 100%;
        z-index: 100;
        background-color: rgba(0, 0, 0, 0.4);
        left: 0;
        top: 0;
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
    <div class="mask" v-show="showBigPic" @click="hideMask"></div>
    <Row type="flex" justify="center" class="code-row-bg">
        <!-- 渲染 cpu 数据信息组件标题: pid -->
        <Col span=17 style="text-align:center" :id="listInfo.process.href">
            <h2>PID-{{ pid }}</h2>
        </Col>
        <br>

        <!-- 渲染 cpu 数据信息组件内容 -->
        <Col span=17>
            <Card>
                <!-- loading 界面，出现条件: 1. 出现服务器错误 2. 数据请求还未结束 -->
                <loading-spin v-if="server_error || !listInfo.done" 
                              :loadingMsg="listInfo.loadingMsg"
                              :error="server_error">
                </loading-spin>

                <!-- 数据请求结束，并且没有错误，则展示对应的信息 -->
                <div style="text-align:center" v-if="!server_error && listInfo.done">
                    <!-- 展示执行时长超过你预设的值的函数列表，默认为 500ms，暂时去除 -->
                    <!-- <Row type="flex" justify="center" class="code-row-bg">
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
                    <br> -->
                    <Row type="flex" justify="center" class="code-row-bg">
                        <Col span=12>
                            <header class="header">
                                <span>火焰图</span>
                            </header>
                        </Col>
                    </Row>
                    <Row type="flex" justify="center" class="code-row-bg">
                        <Col span=22 :class="{'w-flamegraph-change': showBigPic}">
                            <div v-on:mousedown="eidtClient($event)" v-on:mouseup="recordPosition" v-on:mousemove="onDrag($event)" id="drag">
                                <flamegraph :showBigPic="showBigPic" :flamegraphData="singleProfilerData.flamegraphData" v-on:changPic="doTransform" v-on:hidePic="hideMask"></flamegraph>
                            </div>
                        </Col>
                    </Row>
                    
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
    import flamegraph from './flamegraph.vue';

    export default {
        data() {
            return { 
                showBigPic: false,               
                singleProfiler: null, error: null, checkStatTimer: null,
                axiosDone: { profilerDetail: false }, axiosSended: true, sequence: 0,
                columns_long: [
                    { title: '函数名称', key: 'functionName', align: 'center' },
                    { title: '总执行时长', key: 'execTimeAll', align: 'center', sortable: true, sortMethod: this.sortByTime },
                    { title: '调用者名称', key: 'parent', align: 'center' },
                    { title: '占据调用者百分比', key: 'execPercentage', align: 'center' },
                    { title: '系统路径', key: 'filePath', align: 'center', render: this.render }
                ],
                columns_top: [
                    { title: '函数名称', key: 'functionName', align: 'center' },
                    { title: '总执行时长', key: 'execTime', align: 'center', sortable: true, sortMethod: this.sortByTime },
                    { title: '调用者名称', key: 'parent', align: 'center' },
                    { title: '占据调用者百分比', key: 'execPercentage', align: 'center' },
                    { title: '系统路径', key: 'filePath', align: 'center', render: this.render }
                ],
                columns_bail: [
                    { title: '函数名称', key: 'functionName', align: 'center' },
                    { title: '逆优化原因', key: 'bailoutReason', align: 'center' },
                    { title: '系统路径', key: 'filePath', align: 'center', render: this.render }
                ],
                //拖拽参数记录
                transformX: 0,
                transformY: 0,
                flag: false,
                currentX: 0,
                currentY: 0
            }
        }, 

        created() {
            const data = lodash.merge({}, this.rawParams, {pid: this.pid, sequence: this.sequence});
            this.startProfiling(data, 'cpu.vue');
            this.checkStat(data);
        },

        //hook
        beforeDestroy() {
            //destroy interval
            this.checkStatTimer && clearInterval(this.checkStatTimer);
        },

        props: ['pid', 'rawParams', 'startProfiling'],

        components: { loadingSpin, flamegraph },

        methods: {
            sortByTime(o, n, t) { return this.$_js.cpu.methods.sortByTime.apply(this, [o, n, t]); },
            checkStat(data) { this.$_js.cpu.methods.checkStat.call(this, data); },
            formatTime(ts) { return this.$_js.cpu.methods.formatTime.call(this, ts); },            
            render (row, column, index) { return this.$_js.cpu.methods.render.apply(this, [row, column, index]); },
            doTransform() {return this.$_js.cpu.methods.doTransform.call(this)},
            hideMask() {return this.$_js.cpu.methods.hideMask.call(this)},
            eidtClient(event) {return this.$_js.cpu.methods.eidtClient.call(this, event)},
            recordPosition() {return this.$_js.cpu.methods.recordPosition.call(this)},
            onDrag(event) {return this.$_js.cpu.methods.onDrag.call(this, event)}
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