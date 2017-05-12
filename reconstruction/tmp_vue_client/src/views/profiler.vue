<style scoped lang="less">
    .index {
        h1 {    
            font-size: 5.0em;
        }
    }
</style>

<template>
    <div class="index">
        <!-- <div style="text-align:center">Params: {{ params }}</div> -->
        <!-- Reserved Header Bar -->
        <Row><Col style="height:20px;"></Col></Row>
        <br>

        <!-- project title -->
        <Row type="flex" justify="center" class="code-row-bg">
            <Col span=16 style="text-align:center"><h1>{{ processName }}</h1></Col>
            <br>
        </Row>
        <br>

        <!-- render cpu profiling -->
        <div v-if="cpuProfiling">
            <cpu-module 
                v-for="(item, index) in profilerComputed"
                :singleProfiler="item"
                :key="item.uniqueKey"
                :error="error">
            </cpu-module>  
        </div>

        <!-- render mem profiling -->
        <div v-if="memProfiling">
            <mem-module
                v-for="(item, index) in profilerComputed"
                :singleProfiler="item"
                :key="item.uniqueKey"
                :error="error">
            </mem-module>
        </div>

        <!-- navigation float bar -->
        <navigation :list="profilerComputed" needHome=true>
        </navigation>
        
    </div>
</template>
<script>
import Vue from 'vue';
import axios from 'axios';
import cpuModule from './common/profiler/cpu.vue';
import memModule from './common/profiler/mem.vue';
import navigation from './common/navigation.vue';

export default {
    data() {
        return {
            params: {},
            cpuProfiling: false,
            memProfiling: false,
            checkStatTimer: null,
            error: null,
            axiosData: {
                profiler: []
            },
            axiosDone: {
                //control when to stop interval
                profilerDetail: false
            }
        }
    },

    created() {
        const params = this.$route.query; 
        this.params = params;
        this.cpuProfiling = Boolean(params.opt === 'cpu');
        this.memProfiling = Boolean(params.opt === 'mem');

        //send start profiling msg to server
        this.startProfiling(params);

        //check profiling results intervally
        this.checkStat(params);
    },

    //hook
    beforeDestroy() {
        //destroy interval
        this.checkStatTimer && clearInterval(this.checkStatTimer);
    },

    components: {
        cpuModule,
        memModule,
        navigation
    },

    methods: {
        startProfiling(data){
            axios.post('/axiosProfiler', {data}).catch(err=> console.error(err));
        },

        checkStat(data){
            const vm = this;
            _send(data);
            this.checkStatTimer = setInterval(()=>{
                if(vm.axiosDone.profilerDetail){
                    return clearInterval(vm.checkStatTimer);
                }
                _send(data);
            }, 1000);

            function _send(){
                axios.post('/axiosProfilerDetail', {data})
                     .then(response=> {
                         const data = response && response.data || {};
                         if(data.success && data.msg){
                             const msg = JSON.parse(data.msg);
                             const axiosProfilerDetailDone = Boolean(msg.done);
                             if(axiosProfilerDetailDone && msg.error){
                                 vm.error = msg.error;
                             }
                             vm.axiosDone.profilerDetail = axiosProfilerDetailDone;
                             if(Array.isArray(msg.results)){
                                 vm.axiosData.profiler = msg.results;
                             }
                         }else{
                             //const errorMsg = 'Server Inner Error, Please refresh this page!';
                             //vm.error = data.msg || errorMsg;
                             //clearInterval(vm.checkStatTimer);
                         }
                     }).catch(err=> {
                         const errorMsg = `${err}, Please refresh this page!`;
                         vm.error = errorMsg;
                         clearInterval(vm.checkStatTimer);
                     });
            }
        }
    },

    computed: {
        processName(){
            return this.params.processName;
        },

        profilerComputed(){
            return this.axiosData.profiler.map(item=> {
                item.navi = `Pid-${item.processPid}`;
                item.href = `pid_${item.processPid}`;
                item.uniqueKey = `${item.machineUnique}_${item.projectName}_${item.processPid}`;
                return item;
            });
        }
    }
}
</script>