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
        <!-- memory module title -->
        <Col span=16 style="text-align:center" :id="listInfo.process.href">
            <h2>PID-{{ pid }}</h2>
        </Col>
        <br>

        <!-- memory module body -->
        <Col span=16>
            <Card>
                <!-- memory profiling not end, show loding spin -->
                <loading-spin v-if="server_error || !listInfo.done" 
                              :loadingMsg="listInfo.loadingMsg"
                              :error="server_error">
                </loading-spin>

                <!-- show memory profiling results -->
                <div style="text-align:center" v-if="!server_error && listInfo.done">
                    <!-- leak status overview -->
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

                    <!-- if not healthy, show suspicous leak point -->
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
                                <Button type="text" long size="small" style="height:28px"   class="reset-button">
                                    <Alert :type="item.type" class="reset-alert">
                                        <p><Icon type="speedometer"></Icon>&nbsp;&nbsp;{{ item.name }}</p>
                                    </Alert>
                                </Button>
                                <br><br>
                            </div>
                        </Col>
                    </Row>

                    <!-- v8 engine's heap memory details -->
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

                    <!-- search node by id -->
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
            <!-- Modals Constructor -->
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
                <!-- <Table border :columns="columns_type" :data="dataType"></Table> -->
            </Modal>
        </Col>
    </Row>
</div>
</template>

<script>
    import axios from 'axios';
    import lodash from 'lodash';
    import loadingSpin from '../loading.vue';
    import echart3 from '../echart3.vue';

    export default {
        data() {
            return {
                constructor: false,
                
                type: false,

                singleProfiler: null,
                
                error: null,

                checkStatTimer: null,

                axiosDone: {
                    //control when to stop interval
                    profilerDetail: false
                },

                axiosSended: false,

                //1.healthy 2.warning 3.leaking
                process_status: 1,

                circle_color: {
                    healthy: '#5cb85c',
                    warning: '#ff9900',
                    leaking: '#ff3300'
                },

                columns_constructor: [
                    { title: '构造器', key: 'constructor', align: 'center' },
                    { title: '类型', key: 'type', align: 'center' },
                    { title: '距离根节点', key: 'distance', align: 'center' },
                    { title: '对象数量', key: 'object_count', align: 'center', sortable: true },
                    { title: '浅引用大小', key: 'shallow_size', align: 'center', sortable: true, sortMethod: this.sortBySize },
                    { title: '保留引用大小', key: 'retained_size', align: 'center', sortable: true, sortMethod: this.sortBySize }
                ],       

                node_id: ''
            }
        },

        created() {
            const data = lodash.merge({}, this.rawParams, {pid: this.pid});
            this.startProfiling(data, 'mem.vue');
            this.checkStat(data);
        },

        //hook
        beforeDestroy() {
            //destroy interval
            this.checkStatTimer && clearInterval(this.checkStatTimer);
        },

        props: ['pid', 'rawParams', 'startProfiling'],

        components: {
            echart3,
            loadingSpin
        },

        methods: {
            formatPercentage(num, limit=2) {
                return Number(Number(num * 100).toFixed(limit));
            },

            formatSize(size){
                let str =   '';
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
            },

            sortBySize(o, n, t) {
                if(~o.indexOf("GB")){
                    o = o.slice(0, o.indexOf("GB") - 1) * 1024 * 1024 * 1024;
                } else if(~o.indexOf("MB")) {
                    o = o.slice(0, o.indexOf("MB") - 1) * 1024 * 1024;
                } else if(~o.indexOf("KB")) {
                    o = o.slice(0, o.indexOf("KB") - 1) * 1024;
                } else if(~o.indexOf("Bytes")) {
                    o = o.slice(0, o.indexOf("Bytes") - 1);
                }

                if(~n.indexOf("GB")){
                    n = n.slice(0, n.indexOf("GB") - 1) * 1024 * 1024 * 1024;
                } else if(~n.indexOf("MB")) {
                    n = n.slice(0, n.indexOf("MB") - 1) * 1024 * 1024;
                } else if(~n.indexOf("KB")) {
                    n = n.slice(0, n.indexOf("KB") - 1) * 1024;
                } else if(~n.indexOf("Bytes")) {
                    n = n.slice(0, n.indexOf("Bytes") - 1);
                }

                o = Number(o);
                n = Number(n);

                if(t === 'desc') return o < n ? 1 : -1;
                if(t === 'asc') return o < n ? -1 : 1;
            },

            checkStat(data){
                const vm = this;
                _send(data);
                this.checkStatTimer = setInterval(()=>{
                    //if has done, clear interval
                    if(vm.axiosDone.profilerDetail){
                        return clearInterval(vm.checkStatTimer);
                    }
                     //if sended, do not sent
                    if(vm.axiosSended) return;
                    
                    vm.axiosSended = true;
                    _send(data);
                }, 1000);

                function _send(data){
                    axios
                    .post(config.default.axiosPath.getProfilerDetail, {data})
                    .then(response=> {
                        vm.axiosSended = false;
                        const data = response && response.data || {};
                        console.log(data);
                        if(data.success && data.msg){
                            const msg = JSON.parse(data.msg);
                            let axiosProfilerDetailDone = Boolean(msg.done);
                            if(msg.error){
                                axiosProfilerDetailDone = true;
                                vm.error = msg.error;
                            }
                            vm.axiosDone.profilerDetail = axiosProfilerDetailDone;
                            vm.singleProfiler = msg.results;
                        }else{
                            //const errorMsg = 'Server Inner Error, Please refresh this page!';
                            //vm.error = data.msg || errorMsg;
                            //clearInterval(vm.checkStatTimer);
                        }
                    })
                    .catch(err=> {
                        const errorMsg = `${err}, Please refresh this page!`;
                        vm.error = errorMsg;
                        clearInterval(vm.checkStatTimer);
                    });
                }
            },

            typeHandle() {
                this.type = true;
            },

            constructorHandle() {
                this.constructor = true;
            },

            selectHandle(data) {
                //console.log(12333, data, this.node_id);
            },
        },

        computed: {
            singleProfilerData() {
                const data = this.singleProfiler && this.singleProfiler.data || {};
                const heapUsed = data.heapUsed || {};
                const statistics = data.statistics || {};
                const leakPoint = data.leakPoint || [];
                const rootIndex = data.rootIndex || 0;
                const aggregates = data.aggregates || [];

                //compute maxRetainedSize percentage
                const maxRetainedSize = leakPoint[0] && heapUsed[leakPoint[0].index].retainedSize || 0;
                const maxRetainedPercentage = statistics.total && this.formatPercentage(maxRetainedSize / statistics.total) || 0;
                const maxRetainedStatus = maxRetainedPercentage < 30 && 1 || maxRetainedPercentage < 60 && 2 || 3;
                const maxRetainedStatusString = maxRetainedStatus === 1 && '良好' || maxRetainedStatus === 2 && '风险' || '泄露';
                const maxRetainedColor = maxRetainedStatus === 1 && this.circle_color.healthy || maxRetainedStatus === 2 && this.circle_color.warning || this.circle_color.leaking;
                const maxRetainedString = maxRetainedPercentage <=0 && '暂无信息' || `${maxRetainedPercentage} %`;
                const maxRetainedInfo = {
                        percentage: maxRetainedPercentage,
                        color: maxRetainedColor,
                        string: maxRetainedString,
                        status: maxRetainedStatusString
                }

                this.process_status = maxRetainedStatus;
                return {maxRetainedInfo, statistics, leakPoint, heapUsed, rootIndex, aggregates};
            },

            listInfo() {
                const singleProfiler = this.singleProfiler || {};
                const singleProfilerData = this.singleProfilerData || {};

                const done = this.axiosDone.profilerDetail;
                const loadingMsg = singleProfiler.loadingMsg;
                
                const process = {
                    pid: singleProfiler.processPid,
                    href: `pid_${singleProfiler.processPid}`,
                    machineUnique: singleProfiler.machineUnique
                }

                return {done, loadingMsg, process};
            },

            server_error() {
                return this.error || (this.singleProfiler && this.singleProfiler.error) || false;
            },

            statistics() {
                const statistics = this.singleProfilerData && this.singleProfilerData.statistics || {};
                const total = statistics.total || 0;
                const v8heap = statistics.v8heap || 0;
                const native = statistics.native || 0;
                const code = statistics.code || 0;
                const jsArrays = statistics.jsArrays || 0;
                const strings = statistics.strings || 0;
                const system = statistics.system || 0;
                return {
                    statistics, total, v8heap, native, code, jsArrays, strings, system,
                    totalString: this.formatSize(total),
                    v8heapString: this.formatSize(v8heap),
                    nativeString: this.formatSize(native),
                    codeString: this.formatSize(code),
                    jsArraysString: this.formatSize(jsArrays),
                    stringsString: this.formatSize(strings),
                    systemString: this.formatSize(system)
                }
            },

            leakPoint() {
                const leakPoint = this.singleProfilerData && this.singleProfilerData.leakPoint || [];
                const heapUsed = this.singleProfilerData.heapUsed;
                return leakPoint.reduce((pre, next)=> {
                    const detail = heapUsed[next.index] || {retainedSize: 0};
                    const percentage = this.statistics.total && this.formatPercentage(detail.retainedSize / this.statistics.total) || 0;
                    const status = percentage < 60 && 2 || 3;
                    const type = status === 2 && 'warning' || 'error';
                    const name = `${detail.name}::${detail.id}`;
                    pre.push({type, name});
                    return pre;
                },[]).filter((item, index)=> index < 5);
            },

            idList() {
                const singleProfilerData = this.singleProfilerData || {};
                const heapUsed = singleProfilerData.heapUsed || {};
                const indexList = Object.keys(heapUsed);
                indexList.sort((o, n)=>Number(heapUsed[o].distance) < Number(heapUsed[n].distance) ? -1 : 1);
                return indexList.map(item=>{
                    const detail = heapUsed[item] || {};
                    const data = `${detail.name}::${detail.id}`;
                    return {
                        value: data,
                        label: data
                    };
                });
            },

            dataConstructor() {
                const singleProfilerData = this.singleProfilerData || {};
                const aggregates = singleProfilerData.aggregates || [];
                return Object.keys(aggregates).map(constructor=> {
                    const type = aggregates[constructor].type;
                    const distance = aggregates[constructor].distance;
                    const object_count = aggregates[constructor].count;
                    const shallow_size = this.formatSize(aggregates[constructor].self);
                    const retained_size = this.formatSize(aggregates[constructor].maxRet);

                    return { constructor, type, distance, object_count, shallow_size, retained_size };
                });
            },

            echart3Message() {
                return {
                    title: {
                        text: `Pid:${this.pid}`,
                        subtext: 'HeapSnapshot Statistics',
                        x: 'center'  
                    },
                    tooltip: {
                        trigger: 'item',
                        formatter: "{a} <br/>{b} : {c} ({d}%)"
                    },
                    legend: {
                        orient: 'vertical',
                        left: 'left',
                        data: []
                    },
                    series: [
                        {
                            name: 'HeapSnapshot',
                            type: 'pie',
                            radius: '55%',
                            center: ['50%', '60%'],
                            data: [],
                            itemStyle: {
                                emphasis: {
                                    shadowBlur: 10,
                                    shadowOffsetX: 0,
                                    shadowColor: 'rgba(0, 0, 0, 0.5)'
                                }
                            }
                        }
                    ]
                }
            }
        }
    }
</script>