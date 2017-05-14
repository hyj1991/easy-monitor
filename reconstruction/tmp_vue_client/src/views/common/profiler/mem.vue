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
</style>

<template>
<div>
    <Row type="flex" justify="center" class="code-row-bg">
        <!-- memory module title -->
        <Col span=16 style="text-align:center" :id="listInfo.process.href">
            <h2>PID-{{ listInfo.process.pid }}</h2>
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
                                <Button type="text" size="small" style="background:#ebf5ff">
                                        <p style="font-size:1.0em">Type</p>
                                </Button> 
                                <Button type="text" size="small" style="background:#ebf5ff">
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
                            <Select v-model="node_id" placeholder="请输入需要搜索的节点 ID" filterable style="text-align:left">
                                <Option v-for="item in idList" :value="item.value" :key="item">
                                    <p>{{ item.label }}</p>
                                </Option>
                            </Select>
                        </Col>
                    </Row>
                </div>
            </Card>
        </Col>
    </Row>
</div>
</template>

<script>
    import loadingSpin from '../loading.vue';

    export default {
        data() {
            return {
                process_status: 1,

                circle_color: {
                    healthy: '#5cb85c',
                    warning: '#ff9900',
                    leaking: '#ff3300'
                },

                columns: [
                    { title: '节点名称', label: 'name', align: 'center' },
                    { title: '距离根节点', label: 'distance', align: 'center' },
                    { title: '类型', label: 'type', align: 'center' },
                    { title: 'retainedSize', label: 'retainedSize', align: 'center' },
                    { title: '占比', label: 'percentage', align: 'center' }
                ],

                node_id: ''
            }
        },
        
        props: ['singleProfiler', 'error'],

        components: {
            loadingSpin
        },

        methods: {
            formatPercentage(num, limit=2) {
                return Number(Number(num * 100).toFixed(limit));
            },

            formatSize(size){
                let str = '';
                if (size / 1024 < 1) {
                    str = `${(size).toFixed(2)} bytes`;
                } else if (size / 1024 / 1024 < 1) {
                    str = `${(size / 1024).toFixed(2)} KB`;
                } else if (size / 1024 / 1024 / 1024 < 1) {
                    str = `${(size / 1024 / 1024).toFixed(2)} MB`;
                } else {
                    str = `${(size / 1024 / 1024 / 1024).toFixed(2)} GB`;
                }

                return str;
            }
        },

        computed: {
            singleProfilerData() {
                const data = this.singleProfiler && this.singleProfiler.data || {};
                const heapUsed = data.heapUsed || {};
                const statistics = data.statistics || {};
                const leakPoint = data.leakPoint || [];
                const rootIndex = data.rootIndex || 0;

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
                return {maxRetainedInfo, statistics, leakPoint, heapUsed, rootIndex};
            },

            listInfo() {
                const singleProfiler = this.singleProfiler || {};
                const singleProfilerData = this.singleProfilerData || {};

                const done = singleProfiler.done;
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
                return {
                    total,
                    totalString: this.formatSize(total)
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
                console.log(indexList);
                return indexList.map(item=>{
                    const detail = heapUsed[item] || {};
                    const data = `${detail.name}::${detail.id}`;
                    return {
                        value: data,
                        label: data
                    };
                });
            }
        }
    }
</script>