<style scoped lang="less">
    .index {
        h1 {    
            font-size: 5.0em;
        }
    }
</style>

<template>
    <div class="index">
        <!-- 预留 Header Bar -->
        <Row><Col style="height:20px;"></Col></Row>
        <br>

        <!-- 项目名称 -->
        <Row type="flex" justify="center" class="code-row-bg">
            <Col span=16 style="text-align:center"><h1>{{ processName }}</h1></Col>
            <br>
        </Row>
        <br>

        <!-- 渲染 cpu - profiling 组件 -->
        <div v-if="cpuProfiling">
            <cpu-module 
                v-for="(item, index) in pidList"
                :pid="item"
                :rawParams="params"
                :startProfiling="startProfiling"
            >
            </cpu-module>  
        </div>

        <!-- 渲染 mem - profiling 组件 -->
        <div v-if="memProfiling">
            <mem-module
                v-for="(item, index) in pidList"
                :pid="item"
                :rawParams="params"
                :startProfiling="startProfiling">
            </mem-module>
        </div>

        <!-- 悬浮导航栏 -->
        <navigation :list="profilerComputed" needHome=true>
        </navigation>
        
    </div>
</template>
<script>
import cpuModule from './common/profiler/cpu.vue';
import memModule from './common/profiler/mem.vue';
import navigation from './common/navigation.vue';

export default {
    data() {
        return { params: {}, cpuProfiling: false, memProfiling: false }
    },

    created() {
        const params = this.$route.query; 
        this.params = params;
        this.cpuProfiling = Boolean(params.opt === 'cpu');
        this.memProfiling = Boolean(params.opt === 'mem');
        if(!Array.isArray(params.pidList)) params.pidList = [params.pidList];

        this.startProfiling(params, 'profiler.vue');
    },

    components: { cpuModule, memModule, navigation },

    methods: {
        startProfiling(data, tag) { this.$_js.profiler.methods.startProfiling.call(this, data, tag); }
    },

    computed: {
        processName(){ return this.$_js.profiler.computed.processName.call(this); },
        pidList() { return this.$_js.profiler.computed.pidList.call(this); },
        profilerComputed(){ return this.$_js.profiler.computed.profilerComputed.call(this); }
    }
}
</script>