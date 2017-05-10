<style scoped lang="less">
</style>

<template>
<div class="index">
<!-- <div style="text-align:center">{{ choose }}</div> -->
<Row type="flex" justify="center" class="code-row-bg">
    <Col span=10 style="text-align:center">
        <!-- title -->
        <Row type="flex" justify="center" class="code-row-bg">
            <Col span=15 style="text-align:center">
                <h2>{{ processName }} 
                    <Button :disabled="disabled" type="ghost" shape="circle" size="small" 
                    @click=radioHandle() :loading="loading">Start</Button>
                </h2>
            </Col>
        </Row>
        
        <!-- body -->
        <Row type="flex" justify="center" class="code-row-bg">
            <Col span=22>
                <Card>
                    <div style="text-align:center">

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
                disabled: true,
                loading: false,
                loadingTime: false       
            }
        },

        mounted() {
            this.check.call(this, this.singleProjectInfo);
        },

        updated() {
            this.check.call(this, this.singleProjectInfo);
        },

        props: ['singleProjectInfo'],

        methods: {
            //if have process list 
            check(singleProjectInfo) {
                if(singleProjectInfo && singleProjectInfo.processList){
                    if(Array.isArray(singleProjectInfo.processList) && singleProjectInfo.processList.length !== 0){
                        this.disabled = false;
                    }
                }

                if(singleProjectInfo && singleProjectInfo.loadingTime || singleProjectInfo.loadingTime === 0){
                    this.loadingTime = singleProjectInfo.loadingTime;
                }
            },
            
            //jump to profiler
            radioHandle() {
                const vm = this;  
                const data = {
                    processName: vm.processName,
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
            }
           
        },

        computed: {
            processName() {
                if(!this.singleProjectInfo || !this.singleProjectInfo.projectName) {return 'No Project';}
                return this.singleProjectInfo.projectName;
            },

            processList() {
                if(!this.singleProjectInfo || !this.singleProjectInfo.processList || this.singleProjectInfo.processList.length === 0) return [];
                return this.singleProjectInfo.processList.reduce((pre, next)=>{
                    pre.push({type: 'ios-pulse', pid: next, label: next});
                    return pre;
                },[{type: 'ios-browsers-outline', pid: 'All', label: 'all'}]);
            }
        }
    }
</script>