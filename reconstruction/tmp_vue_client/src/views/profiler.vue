<style scoped lang="less">
</style>

<template>
<div>
<div style="text-align:center">Params: {{ params }}</div>
<!-- render cpu profiling -->
<div v-if="cpuProfiling">
    Do CPU
</div>

<!-- render mem profiling -->
<div v-if="memProfiling">
    DO MEM
</div>
    
</div>
</template>

<script>
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
    }
}
</script>