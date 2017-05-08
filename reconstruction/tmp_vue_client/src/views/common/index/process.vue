<style scoped lang="less">
    .process_index {
        h2 {
            font-family: 'Source Sans Pro', 'Helvetica Neue', Arial, sans-serif;
            font-size: 3.2em;
            font-weight: 100;
            color: #657180;
        }
    }

    .header {
        font-family: 'Source Sans Pro', 'Helvetica Neue', Arial, sans-serif;
        font-weight: 300;
        margin: 10px 0 10px;
        position: relative;
    }

    .header:before {
        content: "";
        display: block;
        width: 100%;
        height: 1px;
        background: #eee;
        position: absolute;
        top: 10px;
        left: 0;
    }

    .header span {
        display: inline-block;
        background: #fff;
        padding: 0 18px 0 18px;
        position: relative;
        font-size: 14px;
    }
</style>

<template>
<div class="process_index">
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
            this.checkButtonAble.call(this, this.singleProjectInfo);
        },

        updated() {
            this.checkButtonAble.call(this, this.singleProjectInfo);
        },

        props: ['singleProjectInfo'],

        methods: {
            //if have process list 
            checkButtonAble(singleProjectInfo) {
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
                if(!this.loadingTime){
                    router.push({
                        path: `profiler`, 
                        query: {
                            processName: vm.processName,
                            pid: vm.e_pid,
                            opt: vm.e_opt
                        }
                    });
                    return;
                }

                this.loading = true;
                this.$Message.success(`will do ${this.e_opt} profiling`);

                setTimeout(()=> {
                    vm.loading = false;
                    router.push({
                        path: `profiler`, 
                        query: {
                            processName: vm.processName,
                            pid: vm.e_pid,
                            opt: vm.e_opt
                        }
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