<style scoped lang="less">
</style>
<style>
.ivu-select-input-my-style {}
.ivu-select-input-my-style .ivu-select-input {
    text-align: center;
    padding: 0;
    font-size: 1.0em;
    height: 27px;
    font-weight: 200;
}
.ivu-select-input-my-style.ivu-select-small .ivu-select-input {
    height: 20px;
}
</style>

<template>
<div class="index">
<!-- <div style="text-align:center">{{ choose }}</div> -->
<Row type="flex" justify="center" class="code-row-bg">
    <Col span=10 style="text-align:center">
        <!-- title -->
        <Row type="flex" justify="center" class="code-row-bg">
            <Col span=15 style="text-align:center">
                <h2 :id="processName">{{ processName }} 
                    <Button :disabled="disabled" type="ghost" shape="circle" size="small" 
                    @click="radioHandle" :loading="loading">Start</Button>
                </h2>
            </Col>
        </Row>
        
        <!-- body -->
        <Row type="flex" justify="center" class="code-row-bg">
            <Col span=22>
                <Card>
                    <div style="text-align:center">
                        <!-- choose server -->
                        <header class="header">
                            <span>所在服务器</span>
                        </header>
                        
                        <!-- server list -->
                        <Row type="flex" justify="center" class="code-row-bg">
                            <Col span=8>
                                <Select size="small" v-model="server" filterable class="ivu-select-input-my-style" @on-change="selectHandle">
                                    <Option v-for="item in serverList" :value="item.value" :key="item">{{ item.label }}</Option>
                                </Select>
                            </Col>
                        </Row>

                        <!-- choose process -->
                        <header class="header">
                            <span>选择进程</span>
                        </header>
                        
                        <!-- process id list -->
                        <Radio-group v-model="e_pid" v-for="item in processList">
                            <Radio :label="item.label">
                             <Icon :type="item.type"></Icon>
                             <span>{{ item.pid }}</span>
                            </Radio>
                        </Radio-group>
                        <br>
                        
                        <!-- choose option -->
                        <header class="header">
                            <span>操作</span>
                        </header>

                        <!-- options list -->
                        <Radio-group v-model="e_opt">
                            <Radio label="cpu">
                                <Icon type="ios-gear-outline"></Icon>
                                <span>CPU</span>
                            </Radio>
                            <Radio label="mem">
                                <Icon type="ios-analytics-outline"></Icon>
                                <span>MEM</span>
                            </Radio>
                        </Radio-group>
                        <br>
                    </div>
                </Card>
            </Col>
        </Row>
    </Col>
</Row>
<br>
</div>
</template>

<script>
    import axios from 'axios';
    import router from '../../../main.js';

    export default {
        data(){
            return {
                e_pid: 'all',
                e_opt: 'cpu',
                loading: false,
                server: '',
                pidList: []
            }
        },

        props: ['singleProjectInfo'],

        methods: { 
            //jump to profiler
            radioHandle() {
                const vm = this;  
                const data = {
                    processName: vm.processName,
                    serverName: vm.serverName,
                    pid: vm.e_pid,
                    opt: vm.e_opt
                }

                //notificate server do profiling
                axios.post('/axiosProfiler', {data}).catch(err=> console.error(err));

                //if not loadingTime, jump immediately
                if(!this.loadingTime){
                    router.push({
                        path: `profiler`, 
                        query: data
                    });
                    return;
                }

                //if loadingTime, jump asyncly
                this.loading = true;
                this.$Message.success(`will do ${this.e_opt} profiling`);
                setTimeout(()=> {
                    vm.loading = false;
                    router.push({
                        path: `profiler`, 
                        query: data
                    });
                }, this.loadingTime);
            },

            selectHandle(data) {
                this.pidList = this.singleProjectInfo[data] || [];
            }
           
        },

        computed: {
            serverName() {
                return this.server;
            },

            serverList() {
                const serverList = this.singleProjectInfo.serverList;
                const results = serverList.map(item=> ({
                    label: item,
                    value: item
                }));
                this.server = results[0].label;                 
                
                return results;
            },

            processName() {
                if(!this.singleProjectInfo || !this.singleProjectInfo.projectName) {return 'No Project';}
                return this.singleProjectInfo.projectName;
            },

            processList() {         
                return this.pidList.reduce((pre, next)=>{
                    pre.push({type: 'ios-pulse', pid: next, label: next});
                    return pre;
                },[{type: 'ios-browsers-outline', pid: 'All', label: 'all'}]);
            },

            disabled() {
                if(!Array.isArray(this.pidList)) return true;
                if(this.pidList.length === 0) return true;
                if(this.e_opt === 'mem' && this.e_pid === 'all') return true;

                return false;
            },

            loadingTime() {
                const singleProjectInfo = this.singleProjectInfo;
                if(singleProjectInfo && singleProjectInfo.loadingTime){
                    return singleProjectInfo.loadingTime;
                }

                return false;
            }
        }
    }
</script>