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
        <!-- cpu module title -->
        <Col span=16 style="text-align:center" :id="listInfo.process.href">
            <h2>PID-{{ listInfo.process.pid }}</h2>
        </Col>
        <br>

        <!-- cpu module body -->
        <Col span=16>
            <Card>
                <!-- cpu profiling not end, show loding spin -->
                <loading-spin v-if="server_error || !listInfo.done" 
                              :loadingMsg="listInfo.loadingMsg"
                              :error="server_error">
                </loading-spin>

                <!-- if get cpu profiling data, show this -->
                <div style="text-align:center" v-if="!server_error && listInfo.done">
                    <!-- exec time > your set limit time -->
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
                    
                    <!-- exec time top list -->
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
                    
                    <!-- v8 bailout functions -->
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
    import loadingSpin from '../loading.vue';

    export default {
        data() {
            return {
                spinShow: true,
                
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

        props: ['singleProfiler', 'error'],

        components: {
            loadingSpin
        },

        methods: {
            formatTime(ts){
                let str = '';
                if(ts < 1e3) {
                    str = `${ts.toFixed(2)} ms`;
                }else if(ts < 1e6) {
                    str = `${(ts / 1e3).toFixed(2)} s`;
                }else if(ts < 1e9) {
                    str = `${(ts / 1e6).toFixed(2)} min`;
                }else if(ts < 1e12) {
                    str = `${(ts / 1e9).toFixed(2)} h`;
                }else {
                    str = `${ts.toFixed(2)} ms`;
                }

                return str;
            },

            render (row, column, index){
                const filePath = row.filePath;
                //use overflow-ivu-poptip-ivu-poptip-rel to ovewrite poptip style
                return `<div>
                        <Tooltip trigger="hover" placement="top-start" class="overflow-ivu-poptip-ivu-poptip-rel">
                            <div style="text-overflow:ellipsis;white-space:nowrap;overflow:hidden;">
                                ${filePath}
                            </div>
                            <div slot="content">
                                ${filePath}
                            </div>
                        </Tooltip>
                        </div>`;
            }
        },

        computed: {
            singleProfilerData() {
                const data = this.singleProfiler && this.singleProfiler.data || {};
                const timeout = data.timeout || 200;
                const longFunctions = data.longFunctions || [];
                const topExecutingFunctions = data.topExecutingFunctions || [];
                const bailoutFunctions = data.bailoutFunctions || [];

                return {timeout, longFunctions, topExecutingFunctions, bailoutFunctions};
            },

            listInfo() {
                const singleProfiler = this.singleProfiler || {};
                const singleProfilerData = this.singleProfilerData || {};

                const done = singleProfiler.done;
                const loadingMsg = singleProfiler.loadingMsg;
                const long = {
                    timeout: singleProfilerData.timeout,
                    number: singleProfilerData.longFunctions.length
                }
                const top = {
                    number: singleProfilerData.topExecutingFunctions.length
                }
                const bail = {
                    number: singleProfilerData.bailoutFunctions.length
                }
                const process = {
                    pid: singleProfiler.processPid,
                    href: `pid_${singleProfiler.processPid}`,
                    machineUnique: singleProfiler.machineUnique
                }

                return {long, top, bail, process, done, loadingMsg};
            },

            server_error() {
                return this.error || (this.singleProfiler && this.singleProfiler.error) || false;
            },

            data_long() {
                return this.singleProfilerData.longFunctions.map(item=> ({
                            functionName: item.funcName,
                            execTime: this.formatTime(item.execTime),
                            execPercentage: item.percentage,
                            filePath: item.url
                        }));
            },

            data_top() {
                return this.singleProfilerData.topExecutingFunctions.map(item=> ({
                            functionName: item.funcName,
                            execTime: this.formatTime(item.execTime),
                            execPercentage: item.percentage,
                            filePath: item.url
                        }));
            },

            data_bail() {
                return this.singleProfilerData.bailoutFunctions.map(item=> ({
                            functionName: item.funcName,
                            bailoutReason: item.bailoutReason,
                            filePath: item.url
                        }));
            }
        }
    }
    
</script>