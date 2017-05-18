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
                v-for="(item, index) in pidList"
                :pid="item"
                :rawParams="params"
                :startProfiling="startProfiling"
            >
            </cpu-module>  
        </div>

        <!-- render mem profiling -->
        <div v-if="memProfiling">
            <mem-module
                v-for="(item, index) in pidList"
                :pid="item"
                :rawParams="params"
                :startProfiling="startProfiling">
            </mem-module>
        </div>

        <!-- navigation float bar -->
        <navigation :list="profilerComputed" needHome=true>
        </navigation>
        
    </div>
</template>
<script>
import axios from 'axios';
import cpuModule from './common/profiler/cpu.vue';
import memModule from './common/profiler/mem.vue';
import navigation from './common/navigation.vue';

export default {
    data() {
        return {
            params: {},
            cpuProfiling: false,
            memProfiling: false
        }
    },

    created() {
        const params = this.$route.query; 
        this.params = params;
        this.cpuProfiling = Boolean(params.opt === 'cpu');
        this.memProfiling = Boolean(params.opt === 'mem');
        if(!Array.isArray(params.pidList)) params.pidList = [params.pidList];

        //send start profiling msg to server
        this.startProfiling(params, 'profiler.vue');
    },

    components: {
        cpuModule,
        memModule,
        navigation
    },

    methods: {
        startProfiling(data, tag) {
            data.tag = tag;
            axios.post(config.default.axiosPath.startProfiler, {data})
                 .then(response=> {response.data})
                 .catch(err=> console.error(err));
        }
    },

    computed: {
        processName(){
            return this.params.processName;
        },

        pidList() {
            let pidList = [];
            if(this.params && this.params.pidList && Array.isArray(this.params.pidList)) {
                pidList = this.params.pidList;
            }

            return pidList;
        },

        profilerComputed(){
            return this.pidList.map(item=> {
                const tmp = {};
                tmp.navi = `Pid-${item}`;
                tmp.href = `pid_${item}`;
                return tmp;
            });
        }
    }
}
</script>