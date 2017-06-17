<style scoped lang="less">
    .index p {
        font-size: 1.1em
    }

    .i-circle-custom {
        & h1{
            color: #3f414d;
            font-size: 28px;
            font-weight: normal;
        }
        & p{
            color: #657180;
            font-size: 14px;
            margin: 10px 0 15px;
        }
        & span{
            display: block;
            padding-top: 15px;
            color: #657180;
            font-size: 14px;
            &:before{
                content: '';
                display: block;
                width: 50px;
                height: 1px;
                margin: 0 auto;
                background: #e0e3e6;
                position: relative;
                top: -10px;
            };
        }
        & span i{
            font-style: normal;
            color: #3f414d;
        }
    }
</style>
<style>
    .reset-alert {}
    .reset-button {}
    .remove-alert-border {}
    .timeline-self {}
    .ivu-select-input-my-style-mem {}

    .reset-alert.ivu-alert-error, .reset-alert.ivu-alert-warning, .remove-alert-border.ivu-alert-success{
        border: 0px;
    }
    .reset-alert.ivu-alert {
        padding: 8px 16px;
        margin-bottom: inherit;
    }


    .reset-button.ivu-btn-small {
        padding: inherit;
    }

    .remove-alert-border.ivu-alert {
        padding: 8px 16px;
    }

    .timeline-self .ivu-timeline-item-content {
        top: -5px;
    }

    .ivu-select-input-my-style-mem .ivu-select-input {
        text-align: center;
        padding: 0;
        font-size: 1.0em;
        height: 27px;
        font-weight: 200;
    }  

    .ivu-select-input-my-style-mem .ivu-select-item {
        text-align: left;
        font-weight: 200;
    }

    .ivu-select-input-my-style-mem.ivu-select-single .ivu-select-input {
        height: 30px;
    }
</style>

<template>
<div>
    <Row type="flex" justify="center" class="code-row-bg">
        <!-- memory 模块标题 -->
        <Col span=16 style="text-align:center" :id="listInfo.process.href">
            <h2>PID-{{ pid }}</h2>
        </Col>
        <br>

        <!-- memory 模块体 -->
        <Col span=16>
            <Card>
                <!-- memory 数据采集尚未结束，或者出现服务器错误，则展示 -->
                <loading-spin v-if="server_error || !listInfo.done" 
                              :loadingMsg="listInfo.loadingMsg"
                              :error="server_error">
                </loading-spin>

                <!-- memory 数据采集结束，展示此 -->
                <div style="text-align:center" v-if="!server_error && listInfo.done">
                    <!-- 根据 retainedSize 最大节点占比，来给出内存泄漏风险提示 -->
                    <Row type="flex" justify="center" class="code-row-bg">
                        <Col span=12>
                            <header class="header">
                                <span>Retained Size 最大的节点占比</span>
                            </header>
                        </Col>
                    </Row>
                    <Row type="flex" justify="center" class="code-row-bg">
                        <Col span=22>
                            <i-circle :size="160" :trail-width="3" :stroke-width="4"
                                      :percent="singleProfilerData.maxRetainedInfo.percentage" 
                                      :stroke-color="singleProfilerData.maxRetainedInfo.color">
                                <div class="i-circle-custom">
                                    <!-- max retained-size node -->
                                    <p>{{ singleProfilerData.maxRetainedInfo.string }}</p>                                
                                    <!-- show leak status -->
                                    <span>
                                        <p>状态:<a :style="{color: singleProfilerData.maxRetainedInfo.color}"> {{ singleProfilerData.maxRetainedInfo.status }}  </a></p>
                                    </span>
                                </div>
                            </i-circle>
                        </Col>
                    </Row>

                    <!-- 如果给出内存泄漏风险提示较高，则展示疑似泄漏的内存点 -->
                    <Row type="flex" justify="center" class="code-row-bg">
                        <Col span=12>
                            <header class="header">
                                <span>疑似内存泄漏点分析</span>
                            </header>
                        </Col>
                    </Row>
                    <Row type="flex" justify="center" class="code-row-bg">
                        <!-- show this when no leaking -->
                        <Col span=8 v-if="this.process_status === 1">
                            <p>
                                <Alert type="success" class="remove-alert-border">
                                    暂无泄漏风险
                                </Alert>
                            </p>
                        </Col>
                        <!-- show this when leaking -->
                        <Col span=8 v-if="this.process_status !== 1">
                            <div v-for="item in leakPoint">
                                <Button type="text" long size="small" style="height:28px" class="reset-button" @click="leakHandle(item.name)">
                                    <Alert :type="item.type" class="reset-alert">
                                        <p><Icon type="speedometer"></Icon>&nbsp;&nbsp;{{ item.name }}</p>
                                    </Alert>
                                </Button>
                                <br><br>
                            </div>
                        </Col>
                    </Row>

                    <!-- 展示 v8 引擎堆内分配内存的一些细节 -->
                    <Row type="flex" justify="center" class="code-row-bg">
                        <Col span=12>
                            <header class="header">
                                <span>V8 引擎堆内分配内存细节</span>
                            </header>
                        </Col>
                    </Row>
                    <Row type="flex" justify="center" class="code-row-bg">
                        <Col span=22>
                            <p style="font-size:1.0em">
                                当前进程堆内分配总内存大小为: <a style="color:#3399ff">{{ statistics.totalString }}</a>, 
                                更多内存细节参见以下条目:
                            </p>
                        </Col>
                    </Row>
                    <br>
                    <Row type="flex" justify="center" class="code-row-bg">
                        <Col span= 22>
                            <p style="font-size:1.0em">
                                点击
                                <Button type="text" size="small" style="background:#ebf5ff" @click="typeHandle">
                                        <p style="font-size:1.0em">Type</p>
                                </Button> 
                                <Button type="text" size="small" style="background:#ebf5ff" @click="constructorHandle">
                                    <p style="font-size:1.0em">Constructor</p>
                                </Button>
                                获取按照节点 [ 类型 / 构造器 ] 分类的详情
                            </p>
                        </Col>
                    </Row>
                    <br>

                    <!-- 任意搜索提供的节点引力图 -->
                    <Row type="flex" justify="center" class="code-row-bg">
                        <Col span=12>
                            <header class="header">
                                <span>搜索任意节点</span>
                            </header>
                        </Col>
                    </Row>
                    <Row type="flex" justify="center" class="code-row-bg">
                        <Col span=8>
                            <Select v-model="node_id" placeholder="请输入需要搜索的节点 ID" filterable @on-change="selectHandle" class="ivu-select-input-my-style-mem">
                                <Option v-for="item in idList" :value="item.value" :key="item">{{ item.label }}</Option>
                            </Select>
                        </Col>
                    </Row>
                </div>
            </Card>
            <!-- 以下是 modal 框 -->
            <Modal
                v-model="constructor"
                title="构造器分类详情"
                width="950">
                <Table border :columns="columns_constructor" :data="dataConstructor"></Table>
            </Modal>
            <!-- Modals Type -->
            <Modal
                v-model="type"
                title="类型概览">
                <echart3 
                    :data="statistics"
                    :message="echart3Message">
                </echart3>
            </Modal>
            <!-- Modals Force -->
            <Modal
                v-model="force"
                :title="`[ ${modal_node_id} ] 引力图`"
                width="1000">
                <force 
                    :forceGraph="forceGraphLeakPoint"
                    :heapMap="singleProfilerData.heapUsed"
                    :formatSize="formatSize">
                </force>
            </Modal>
        </Col>
    </Row>
</div>
</template>

<script>
    import axios from 'axios';
    import lodash from 'lodash';
    import force from './force.vue';
    import loadingSpin from '../loading.vue';
    import echart3 from '../echart3.vue';

    export default {
        data() {
            return { 
                constructor: false, type: false, force: false, modal_node_id: null,
                singleProfiler: null, error: null, checkStatTimer: null,
                axiosDone: { profilerDetail: false },
                axiosSended: true, node_id: '',
                process_status: 1, //1.healthy 2.warning 3.leaking 
                circle_color: { healthy: '#5cb85c', warning: '#ff9900', leaking: '#ff3300' },
                columns_constructor: [
                    { title: '构造器', key: 'constructor', align: 'center' },
                    { title: '类型', key: 'type', align: 'center' },
                    { title: '距离根节点', key: 'distance', align: 'center' },
                    { title: '对象数量', key: 'object_count', align: 'center', sortable: true },
                    { title: '浅引用大小', key: 'shallow_size', align: 'center', sortable: true, sortMethod: this.sortBySize },
                    { title: '保留引用大小', key: 'retained_size', align: 'center', sortable: true, sortMethod: this.sortBySize }
                ]
            }
        },

        created() {
            const data = lodash.merge({}, this.rawParams, {pid: this.pid});
            this.startProfiling(data, 'mem.vue');
            this.checkStat(data);
        },

        //hook
        beforeDestroy(data) {
            //destroy interval
            this.checkStatTimer && clearInterval(this.checkStatTimer);
        },

        props: ['pid', 'rawParams', 'startProfiling'],

        components: { force, echart3, loadingSpin },

        methods: {
            formatPercentage(num, limit=2) { return this.$_js.mem.methods.formatPercentage.call(this, num, limit); },
            formatSize(size){ return this.$_js.mem.methods.formatSize.call(this, size); },
            sortBySize(o, n, t) { return this.$_js.mem.methods.sortBySize.apply(this, [o, n, t]); },
            checkStat(data){ this.$_js.mem.methods.checkStat.call(this, data); },
            typeHandle() { this.$_js.mem.methods.typeHandle.call(this); },
            constructorHandle() { this.$_js.mem.methods.constructorHandle.call(this); },
            selectHandle(id) { this.$_js.mem.methods.selectHandle.call(this, id); },
            leakHandle(id) { this.$_js.mem.methods.leakHandle.call(this, id); }
        },

        computed: {
            singleProfilerData() { return this.$_js.mem.computed.singleProfilerData.call(this); },
            listInfo() { return this.$_js.mem.computed.listInfo.call(this); },
            server_error() { return this.$_js.mem.computed.server_error.call(this); },
            statistics() { return this.$_js.mem.computed.statistics.call(this); },
            leakPoint() { return this.$_js.mem.computed.leakPoint.call(this); },
            idList() { return this.$_js.mem.computed.idList.call(this); },
            dataConstructor() { return this.$_js.mem.computed.dataConstructor.call(this); },
            echart3Message() { return this.$_js.mem.computed.echart3Message.call(this); },
            forceGraphLeakPoint() { return this.$_js.mem.computed.forceGraphLeakPoint.call(this); }
        }
    }
</script>